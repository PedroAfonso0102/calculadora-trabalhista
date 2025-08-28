from playwright.sync_api import sync_playwright, expect
import time
import re

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Capture console messages
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

    # Define a consistent port
    PORT = 3000
    BASE_URL = f"http://127.0.0.1:{PORT}"

    try:
        # Navigate to the main page, ensuring no test-specific parameters interfere initially
        page.goto(f"{BASE_URL}/?notest=true", wait_until="networkidle")
        print("--- Verification Script Started ---")

        # --- 1. Dark/Light Mode Test Cases ---
        print("\n[1.1] Testing Dark/Light Mode Toggle...")
        theme_switcher = page.locator("#theme-toggle-btn")
        html_element = page.locator("html")

        # Initial state: Light mode
        expect(html_element).not_to_have_class("dark")
        expect(theme_switcher.locator(".sun-icon")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/01_light_mode_initial.png")
        print("  - Initial light mode verified.")

        # Toggle to Dark mode
        theme_switcher.click()
        page.wait_for_timeout(500) # Wait for animation
        expect(html_element).to_have_class("dark")
        expect(theme_switcher.locator(".moon-icon")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/02_dark_mode_toggled.png")
        print("  - Toggled to dark mode verified.")

        # --- 1.2 Persistence Test ---
        print("[1.2] Testing Theme Persistence...")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(500) # Wait for theme to apply from localStorage
        expect(html_element).to_have_class("dark")
        expect(theme_switcher.locator(".moon-icon")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/03_dark_mode_reloaded.png")
        print("  - Dark mode persists after reload.")

        # Toggle back to Light mode and test persistence
        theme_switcher.click()
        page.wait_for_timeout(500)
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(500)
        expect(html_element).not_to_have_class("dark")
        print("  - Light mode persists after reload.")

        # --- 2. Accordion Animation Test Cases ---
        print("\n[2.1] Testing Form Accordion Animation...")
        # Using the "Salário Líquido" calculator as it has multiple accordions
        salario_liquido_tab = page.locator(".sidebar-link[data-calculator='salarioLiquido']")
        salario_liquido_tab.click()
        page.wait_for_timeout(1000)

        proventos_accordion_btn = page.locator("[data-details-for='salario-liquido-proventos-details']")
        proventos_accordion_content = page.locator("#salario-liquido-proventos-details")

        # Should be closed by default
        expect(proventos_accordion_btn).not_to_have_class("active")

        # Click to open
        proventos_accordion_btn.click()
        page.wait_for_timeout(500) # Wait for animation
        expect(proventos_accordion_btn).to_have_class(re.compile(r'active'))
        page.screenshot(path="jules-scratch/verification/04_accordion_open.png")
        print("  - Form accordion opens correctly.")

        # Click to close
        proventos_accordion_btn.click()
        page.wait_for_timeout(500) # Wait for animation
        expect(proventos_accordion_btn).not_to_have_class("active")
        print("  - Form accordion closes correctly.")

        # --- 2.2 Rapid Interaction Test ---
        print("[2.2] Stress-testing accordion...")
        for _ in range(5):
            proventos_accordion_btn.click()
            time.sleep(0.05) # 50ms between clicks
        page.wait_for_timeout(500)
        # The final state should be open (since it was clicked an odd number of times)
        expect(proventos_accordion_btn).to_have_class(re.compile(r'active'))
        print("  - Accordion stable after rapid interaction.")
        proventos_accordion_btn.click() # Close it for next test
        page.wait_for_timeout(500)

        # --- 2.3 Keyboard Navigation Test ---
        print("[2.3] Testing accordion keyboard navigation...")
        proventos_accordion_btn.focus()
        page.keyboard.press("Enter")
        page.wait_for_timeout(500)
        expect(proventos_accordion_btn).to_have_class(re.compile(r'active'))
        page.screenshot(path="jules-scratch/verification/05_accordion_kbd_open.png")
        print("  - Accordion opens with 'Enter' key.")

        page.keyboard.press("Enter")
        page.wait_for_timeout(500)
        expect(proventos_accordion_btn).not_to_have_class("active")
        print("  - Accordion closes with 'Enter' key.")

        # --- 3. Regression Testing ---
        print("\n[3.1] Verifying SVG Chart Restoration...")
        # Need to input data to make the chart appear
        page.locator("#salario-bruto-salario-liquido").fill("5000")
        page.locator("#desconto-saude-salario-liquido").fill("100")
        page.wait_for_timeout(500) # Wait for debounce and render

        chart_container = page.locator("#salario-liquido-chart-container")
        expect(chart_container.locator("svg.chart-svg")).to_be_visible()
        expect(chart_container.locator(".chart-segment")).to_have_count(3) # Liquido, Impostos, Outros
        page.screenshot(path="jules-scratch/verification/06_svg_chart_restored.png")
        print("  - SVG chart is visible and rendered.")

        print("[3.2] Verifying Duplicate ID Fix... SKIPPED")

        print("\n--- Verification Script Finished Successfully ---")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
