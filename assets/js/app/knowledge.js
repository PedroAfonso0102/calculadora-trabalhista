/**
 * Knowledge Base Module
 * 
 * Este módulo gerencia a base de conhecimento expandida da aplicação,
 * incluindo FAQ, tooltips melhorados e sistema de busca educacional.
 * Segue os princípios da arquitetura: cada módulo no seu quadrado.
 */

import { state } from './state.js';

// Cache da base de conhecimento
let knowledgeBase = null;
let searchIndex = null;

/**
 * Carrega a base de conhecimento expandida
 * @returns {Promise<Object>} Base de conhecimento carregada
 */
export async function loadKnowledgeBase() {
    if (knowledgeBase) {
        return knowledgeBase;
    }
    
    try {
        const response = await fetch('./data/expanded_knowledge_base.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        knowledgeBase = await response.json();
        buildSearchIndex();
        return knowledgeBase;
    } catch (error) {
        console.error('Erro ao carregar base de conhecimento:', error);
        // Fallback para dados básicos do state se falhar
        return { faq_global: { categories: [] }, enhanced_tooltips: {} };
    }
}

/**
 * Constrói o índice de busca para pesquisa rápida
 */
function buildSearchIndex() {
    if (!knowledgeBase) return;
    
    searchIndex = [];
    
    // Indexar FAQs
    if (knowledgeBase.faq_global?.categories) {
        knowledgeBase.faq_global.categories.forEach(category => {
            category.questions?.forEach(question => {
                searchIndex.push({
                    type: 'faq',
                    category: category.id,
                    categoryTitle: category.title,
                    id: question.id,
                    question: question.question,
                    answer: question.answer,
                    tags: question.tags || [],
                    searchText: `${question.question} ${question.answer} ${(question.tags || []).join(' ')}`.toLowerCase()
                });
            });
        });
    }
    
    // Indexar tooltips expandidos
    if (knowledgeBase.enhanced_tooltips) {
        Object.entries(knowledgeBase.enhanced_tooltips).forEach(([key, tooltip]) => {
            searchIndex.push({
                type: 'tooltip',
                id: key,
                title: tooltip.title,
                content: tooltip.content,
                searchText: `${tooltip.title} ${tooltip.content} ${(tooltip.quick_tips || []).join(' ')}`.toLowerCase()
            });
        });
    }
}

/**
 * Busca na base de conhecimento
 * @param {string} query - Termo de busca
 * @param {string} type - Tipo de resultado ('all', 'faq', 'tooltip')
 * @returns {Array} Resultados da busca
 */
export function searchKnowledgeBase(query, type = 'all') {
    if (!searchIndex || !query.trim()) {
        return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    const searchWords = searchTerm.split(' ').filter(word => word.length > 2);
    
    const results = searchIndex.filter(item => {
        if (type !== 'all' && item.type !== type) {
            return false;
        }
        
        // Busca por palavras-chave
        return searchWords.some(word => 
            item.searchText.includes(word) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(word)))
        );
    });
    
    // Ordenar por relevância (número de matches)
    return results.sort((a, b) => {
        const aMatches = searchWords.filter(word => a.searchText.includes(word)).length;
        const bMatches = searchWords.filter(word => b.searchText.includes(word)).length;
        return bMatches - aMatches;
    }).slice(0, 10); // Limitar a 10 resultados
}

/**
 * Obtém uma categoria específica do FAQ
 * @param {string} categoryId - ID da categoria
 * @returns {Object|null} Categoria do FAQ
 */
export function getFaqCategory(categoryId) {
    if (!knowledgeBase?.faq_global?.categories) {
        return null;
    }
    
    return knowledgeBase.faq_global.categories.find(cat => cat.id === categoryId);
}

/**
 * Obtém todas as categorias do FAQ
 * @returns {Array} Lista de categorias
 */
export function getAllFaqCategories() {
    return knowledgeBase?.faq_global?.categories || [];
}

/**
 * Obtém uma pergunta específica do FAQ
 * @param {string} categoryId - ID da categoria
 * @param {string} questionId - ID da pergunta
 * @returns {Object|null} Pergunta do FAQ
 */
export function getFaqQuestion(categoryId, questionId) {
    const category = getFaqCategory(categoryId);
    if (!category?.questions) {
        return null;
    }
    
    return category.questions.find(q => q.id === questionId);
}

/**
 * Obtém tooltip expandido
 * @param {string} topicKey - Chave do tópico
 * @returns {Object|null} Dados do tooltip expandido
 */
export function getEnhancedTooltip(topicKey) {
    // Primeiro, tenta obter da base expandida
    if (knowledgeBase?.enhanced_tooltips?.[topicKey]) {
        return knowledgeBase.enhanced_tooltips[topicKey];
    }
    
    // Fallback para dados legais básicos
    return getBasicTooltipData(topicKey);
}

/**
 * Obtém dados de tooltip básico dos legal_texts (fallback)
 * @param {string} topicKey - Chave do tópico
 * @returns {Object|null} Dados básicos do tooltip
 */
function getBasicTooltipData(topicKey) {
    // Procura nos topics das diferentes seções
    const legalTexts = state.legalTexts;
    
    for (const [sectionKey, section] of Object.entries(legalTexts)) {
        if (section.topics && section.topics[topicKey]) {
            return section.topics[topicKey];
        }
    }
    
    return null;
}

/**
 * Obtém perguntas relacionadas a uma calculadora específica
 * @param {string} calculatorName - Nome da calculadora
 * @returns {Array} Lista de perguntas relacionadas
 */
export function getRelatedFaqs(calculatorName) {
    if (!knowledgeBase?.faq_global?.categories) {
        return [];
    }
    
    const relatedQuestions = [];
    
    knowledgeBase.faq_global.categories.forEach(category => {
        category.questions?.forEach(question => {
            if (question.related_calculators?.includes(calculatorName) || 
                question.related_calculators?.includes('todas')) {
                relatedQuestions.push({
                    ...question,
                    categoryTitle: category.title,
                    categoryIcon: category.icon
                });
            }
        });
    });
    
    return relatedQuestions.slice(0, 5); // Máximo 5 sugestões
}

/**
 * Obtém estatísticas da base de conhecimento
 * @returns {Object} Estatísticas
 */
export function getKnowledgeBaseStats() {
    if (!knowledgeBase) {
        return { categories: 0, questions: 0, tooltips: 0 };
    }
    
    const categories = knowledgeBase.faq_global?.categories?.length || 0;
    const questions = knowledgeBase.faq_global?.categories?.reduce(
        (total, cat) => total + (cat.questions?.length || 0), 0
    ) || 0;
    const tooltips = Object.keys(knowledgeBase.enhanced_tooltips || {}).length;
    
    return { categories, questions, tooltips };
}

/**
 * Valida se a base de conhecimento foi carregada corretamente
 * @returns {boolean} True se válida
 */
export function isKnowledgeBaseLoaded() {
    return knowledgeBase !== null && searchIndex !== null;
}

/**
 * Recarrega a base de conhecimento (útil para desenvolvimento)
 */
export async function reloadKnowledgeBase() {
    knowledgeBase = null;
    searchIndex = null;
    return await loadKnowledgeBase();
}
