// ==========================================
// Feedback Widget System - Demo App
// ==========================================

// Store feedback items (simulating backend storage)
let feedbackItems = [];

// Store console logs for feedback
let consoleLogs = [];
const maxConsoleLogs = 100;

// ==========================================
// AI Classification Label Definitions
// ==========================================

const AI_LABEL_CONFIG = {
    // Allowed product areas
    productAreas: [
        'Cards',
        'Payments',
        'OnboardingKYC',
        'Support',
        'AppUX',
        'PricingFees',
        'Security',
        'ReliabilityPerformance'
    ],

    // Topics (flat list)
    topics: [
        'Fees',
        'KYC',
        'Bug',
        'UX',
        'Performance',
        'ResponseTime',
        'Quality',
        'SecurityConcern',
        'Other'
    ],

    // Subtopics by topic
    subtopics: {
        'Fees': ['exchange_fee', 'withdrawal_fee', 'subscription_fee', 'unexpected_charge', 'unclear_pricing', 'Other'],
        'KYC': ['document_rejected', 'selfie_failed', 'verification_slow', 'unclear_requirements', 'Other'],
        'Bug': ['app_crash', 'feature_not_working', 'login_issue', 'Other'],
        'UX': ['navigation_confusing', 'missing_feature', 'design_issue', 'Other'],
        'Performance': ['slow_loading', 'freezes', 'downtime', 'Other'],
        'ResponseTime': ['Other'],
        'Quality': ['Other'],
        'SecurityConcern': ['Other'],
        'Other': ['Other']
    },

    // Feature labels (flat list)
    featureLabels: [
        'Card Controls',
        'Card Screen',
        'Currency Exchange',
        'Cash Withdrawal',
        'Payment Processing',
        'KYC Flow',
        'Support Chat',
        'Push Notifications',
        'App Navigation',
        'Subscription Fees',
        'Security Monitoring'
    ],

    // Classification thresholds
    confidenceThreshold: 0.75,

    // Keyword mappings for classification
    keywordMappings: {
        // Product areas
        'Cards': ['card', 'virtual card', 'physical card', 'card controls', 'freeze card', 'block card', 'card limit'],
        'Payments': ['payment', 'transfer', 'send money', 'receive', 'transaction', 'pay', 'withdraw', 'deposit'],
        'OnboardingKYC': ['kyc', 'verification', 'document', 'selfie', 'identity', 'onboarding', 'sign up', 'register'],
        'Support': ['support', 'help', 'chat', 'contact', 'agent', 'response', 'ticket'],
        'AppUX': ['app', 'interface', 'design', 'navigation', 'button', 'screen', 'layout', 'confusing', 'intuitive'],
        'PricingFees': ['fee', 'price', 'cost', 'charge', 'subscription', 'pricing', 'expensive', 'free'],
        'Security': ['security', 'password', 'login', '2fa', 'authentication', 'hack', 'fraud', 'suspicious'],
        'ReliabilityPerformance': ['slow', 'crash', 'freeze', 'loading', 'down', 'error', 'bug', 'not working', 'performance'],
        // Topics
        'Fees': ['fee', 'charge', 'cost', 'price', 'expensive', 'subscription'],
        'KYC': ['kyc', 'verification', 'document', 'selfie', 'identity', 'rejected'],
        'Bug': ['bug', 'crash', 'error', 'broken', 'not working', 'issue', 'problem'],
        'UX': ['confusing', 'difficult', 'unclear', 'design', 'navigation', 'missing'],
        'Performance': ['slow', 'loading', 'freeze', 'lag', 'timeout'],
        'ResponseTime': ['response', 'wait', 'reply', 'hours', 'days'],
        'SecurityConcern': ['security', 'hack', 'fraud', 'suspicious', 'unauthorized']
    }
};

// ==========================================
// AI Classification Engine
// ==========================================

/**
 * Classifies a feedback item with structured labels
 * @param {Object} feedbackItem - The feedback item to classify
 * @returns {Object} - Classification result with labels
 */
function classifyFeedback(feedbackItem) {
    const text = `${feedbackItem.title || ''} ${feedbackItem.description || ''}`.toLowerCase();
    const url = feedbackItem.sessionContext?.url || '';
    const category = feedbackItem.category;

    // Step 1: Detect product area from URL and keywords
    const productArea = detectProductArea(text, url);

    // Step 2: Detect topic and subtopic
    const { topic, subtopic } = detectTopicSubtopic(text, category);

    // Step 3: Determine feature label
    const featureLabel = detectFeatureLabel(text, productArea);

    // Step 4: Calculate confidence score
    const confidence = calculateConfidence(text, productArea, topic);

    // Step 5: Apply guardrails
    const validatedLabels = applyGuardrails({
        product_area: productArea,
        topic: topic,
        subtopic: subtopic,
        feature_label: featureLabel,
        confidence: confidence
    });

    return {
        ...validatedLabels,
        needs_review: validatedLabels.confidence < AI_LABEL_CONFIG.confidenceThreshold,
        classified_at: new Date().toISOString(),
        manually_verified: false,
        classification_version: '1.0'
    };
}

/**
 * Detects product area from text and URL context
 */
function detectProductArea(text, url) {
    const urlPath = url.toLowerCase();

    // Check URL path for hints
    if (urlPath.includes('/card')) return 'Cards';
    if (urlPath.includes('/payment') || urlPath.includes('/transfer')) return 'Payments';
    if (urlPath.includes('/kyc') || urlPath.includes('/verification') || urlPath.includes('/onboarding')) return 'OnboardingKYC';
    if (urlPath.includes('/support') || urlPath.includes('/help')) return 'Support';
    if (urlPath.includes('/settings') || urlPath.includes('/profile')) return 'AppUX';
    if (urlPath.includes('/pricing') || urlPath.includes('/subscription')) return 'PricingFees';
    if (urlPath.includes('/security')) return 'Security';

    // Check text for keyword matches
    let bestMatch = { area: 'AppUX', score: 0 };

    for (const [area, keywords] of Object.entries(AI_LABEL_CONFIG.keywordMappings)) {
        if (AI_LABEL_CONFIG.productAreas.includes(area)) {
            const matchCount = keywords.filter(kw => text.includes(kw)).length;
            if (matchCount > bestMatch.score) {
                bestMatch = { area, score: matchCount };
            }
        }
    }

    return bestMatch.score > 0 ? bestMatch.area : 'AppUX';
}

/**
 * Detects topic and subtopic based on text content and feedback category
 */
function detectTopicSubtopic(text, category) {
    // Fees detection
    if (text.match(/fee|charge|cost|price|expensive|subscription|pricing/i)) {
        if (text.match(/exchange|convert|currency/i)) return { topic: 'Fees', subtopic: 'exchange_fee' };
        if (text.match(/withdraw/i)) return { topic: 'Fees', subtopic: 'withdrawal_fee' };
        if (text.match(/subscription|monthly|plan/i)) return { topic: 'Fees', subtopic: 'subscription_fee' };
        if (text.match(/unexpected|surprise|hidden/i)) return { topic: 'Fees', subtopic: 'unexpected_charge' };
        if (text.match(/unclear|confus|understand/i)) return { topic: 'Fees', subtopic: 'unclear_pricing' };
        return { topic: 'Fees', subtopic: 'Other' };
    }

    // KYC detection
    if (text.match(/kyc|verification|document|selfie|identity|onboard/i)) {
        if (text.match(/reject/i)) return { topic: 'KYC', subtopic: 'document_rejected' };
        if (text.match(/selfie|photo|face/i)) return { topic: 'KYC', subtopic: 'selfie_failed' };
        if (text.match(/slow|wait|long|days/i)) return { topic: 'KYC', subtopic: 'verification_slow' };
        if (text.match(/unclear|confus|what|how/i)) return { topic: 'KYC', subtopic: 'unclear_requirements' };
        return { topic: 'KYC', subtopic: 'Other' };
    }

    // Bug detection
    if (text.match(/bug|crash|error|broken|not working|issue|problem|fail/i)) {
        if (text.match(/crash/i)) return { topic: 'Bug', subtopic: 'app_crash' };
        if (text.match(/login|sign in|auth/i)) return { topic: 'Bug', subtopic: 'login_issue' };
        return { topic: 'Bug', subtopic: 'feature_not_working' };
    }

    // Performance detection
    if (text.match(/slow|loading|lag|freeze|timeout|performance/i)) {
        if (text.match(/slow|loading|lag/i)) return { topic: 'Performance', subtopic: 'slow_loading' };
        if (text.match(/freeze|stuck|hang/i)) return { topic: 'Performance', subtopic: 'freezes' };
        if (text.match(/down|outage|unavailable/i)) return { topic: 'Performance', subtopic: 'downtime' };
        return { topic: 'Performance', subtopic: 'Other' };
    }

    // UX detection
    if (text.match(/confus|difficult|unclear|design|navigation|missing|intuitive/i)) {
        if (text.match(/navigation|find|where/i)) return { topic: 'UX', subtopic: 'navigation_confusing' };
        if (text.match(/missing|add|need|want/i)) return { topic: 'UX', subtopic: 'missing_feature' };
        if (text.match(/design|look|ugly|beautiful/i)) return { topic: 'UX', subtopic: 'design_issue' };
        return { topic: 'UX', subtopic: 'Other' };
    }

    // Response time detection
    if (text.match(/response|reply|wait|support|hours|days/i)) {
        return { topic: 'ResponseTime', subtopic: 'Other' };
    }

    // Security detection
    if (text.match(/security|hack|fraud|suspicious|unauthorized/i)) {
        return { topic: 'SecurityConcern', subtopic: 'Other' };
    }

    // Map feedback category to default topics
    const categoryTopicMap = {
        'bug': { topic: 'Bug', subtopic: 'feature_not_working' },
        'feature': { topic: 'UX', subtopic: 'missing_feature' },
        'improvement': { topic: 'UX', subtopic: 'Other' }
    };

    return categoryTopicMap[category] || { topic: 'Other', subtopic: 'Other' };
}

/**
 * Detects the specific feature label
 */
function detectFeatureLabel(text, productArea) {
    const featureLabels = AI_LABEL_CONFIG.featureLabels;

    // Keyword matching for features
    for (const feature of featureLabels) {
        const featureWords = feature.toLowerCase().split(/\s+/);
        if (featureWords.some(word => text.includes(word))) {
            return feature;
        }
    }

    // Default feature based on product area
    const areaFeatureMap = {
        'Cards': 'Card Screen',
        'Payments': 'Payment Processing',
        'OnboardingKYC': 'KYC Flow',
        'Support': 'Support Chat',
        'AppUX': 'App Navigation',
        'PricingFees': 'Subscription Fees',
        'Security': 'Security Monitoring',
        'ReliabilityPerformance': 'App Navigation'
    };

    return areaFeatureMap[productArea] || 'App Navigation';
}

/**
 * Calculates confidence score based on match quality
 */
function calculateConfidence(text, productArea, topic) {
    let confidence = 0.5;

    // Boost for specific keyword matches
    const areaKeywords = AI_LABEL_CONFIG.keywordMappings[productArea] || [];
    const topicKeywords = AI_LABEL_CONFIG.keywordMappings[topic] || [];

    const areaMatches = areaKeywords.filter(kw => text.includes(kw)).length;
    const topicMatches = topicKeywords.filter(kw => text.includes(kw)).length;

    confidence += Math.min(areaMatches * 0.1, 0.25);
    confidence += Math.min(topicMatches * 0.1, 0.25);

    // Boost for longer, more detailed descriptions
    if (text.length > 100) confidence += 0.1;
    if (text.length > 200) confidence += 0.05;

    // Cap at 0.95 for simulated classification
    return Math.min(Math.round(confidence * 100) / 100, 0.95);
}

/**
 * Validates labels against allowed sets (guardrails)
 */
function applyGuardrails(labels) {
    const validated = { ...labels };

    // Validate product_area
    if (!AI_LABEL_CONFIG.productAreas.includes(validated.product_area)) {
        validated.product_area = 'AppUX';
        validated.confidence *= 0.8;
    }

    // Validate topic (now a flat array)
    if (!AI_LABEL_CONFIG.topics.includes(validated.topic)) {
        validated.topic = 'Other';
        validated.confidence *= 0.8;
    }

    // Validate subtopic belongs to topic
    const validSubtopics = AI_LABEL_CONFIG.subtopics[validated.topic] || ['Other'];
    if (!validSubtopics.includes(validated.subtopic)) {
        validated.subtopic = validSubtopics[0] || 'Other';
        validated.confidence *= 0.9;
    }

    // Validate feature_label (now a flat array)
    if (!AI_LABEL_CONFIG.featureLabels.includes(validated.feature_label)) {
        validated.feature_label = 'App Navigation';
        validated.confidence *= 0.9;
    }

    return validated;
}

/**
 * Reclassifies all existing feedback items
 */
function reclassifyAllFeedback() {
    feedbackItems.forEach(item => {
        if (!item.aiLabels || !item.aiLabels.manually_verified) {
            item.aiLabels = classifyFeedback(item);
        }
    });
    saveFeedbackToStorage();
    updateDashboard();
    updateAISummaryTab();
    showInAppNotification('AI Classification Complete', `Reclassified ${feedbackItems.length} items`);
}

// ==========================================
// AI Summary Tab Functions
// ==========================================

/**
 * Switches between admin dashboard tabs
 */
function switchAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    if (tabName === 'feedback') {
        document.querySelector('.admin-tab:first-child')?.classList.add('active');
        document.getElementById('feedbackTabContent').classList.add('active');
        document.getElementById('aiSummaryTabContent').classList.remove('active');
    } else if (tabName === 'ai-summary') {
        document.querySelector('.admin-tab:last-child')?.classList.add('active');
        document.getElementById('feedbackTabContent').classList.remove('active');
        document.getElementById('aiSummaryTabContent').classList.add('active');
        updateAISummaryTab();
    }
}

/**
 * Updates the AI Summary tab content
 */
function updateAISummaryTab() {
    updateAIStats();
    renderAICategoryGroups();
}

/**
 * Updates AI summary statistics
 */
function updateAIStats() {
    const classified = feedbackItems.filter(f => f.aiLabels).length;
    const needsReview = feedbackItems.filter(f => f.aiLabels?.needs_review).length;
    const verified = feedbackItems.filter(f => f.aiLabels?.manually_verified).length;

    const classifiedEl = document.getElementById('classifiedCount');
    const needsReviewEl = document.getElementById('needsReviewCount');
    const verifiedEl = document.getElementById('verifiedCount');

    if (classifiedEl) classifiedEl.textContent = classified;
    if (needsReviewEl) needsReviewEl.textContent = needsReview;
    if (verifiedEl) verifiedEl.textContent = verified;
}

/**
 * Groups feedback items by product_area
 */
function groupFeedbackByProductArea() {
    const groups = {};
    AI_LABEL_CONFIG.productAreas.forEach(area => {
        groups[area] = [];
    });

    feedbackItems.forEach(item => {
        const area = item.aiLabels?.product_area || 'AppUX';
        if (!groups[area]) groups[area] = [];
        groups[area].push(item);
    });

    return groups;
}

/**
 * Groups items by feature label
 */
function groupByFeatureLabel(items) {
    const features = {};
    items.forEach(item => {
        const feature = item.aiLabels?.feature_label || 'General';
        features[feature] = (features[feature] || 0) + 1;
    });
    return features;
}

/**
 * Calculates trend for a category (items added in last 7 days)
 */
function calculateTrend(items) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentItems = items.filter(item => new Date(item.submittedAt) > weekAgo);
    return { count: recentItems.length };
}

/**
 * Generates an AI summary for a category
 */
function generateCategorySummary(items) {
    if (items.length === 0) return 'No feedback in this category.';

    // Analyze common patterns
    const topics = {};
    const priorities = { critical: 0, high: 0, medium: 0, low: 0 };

    items.forEach(item => {
        const topic = item.aiLabels?.topic || 'General';
        topics[topic] = (topics[topic] || 0) + 1;
        priorities[item.priority] = (priorities[item.priority] || 0) + 1;
    });

    const topTopic = Object.entries(topics).sort((a, b) => b[1] - a[1])[0];
    const criticalCount = priorities.critical + priorities.high;

    let summary = `${items.length} feedback item${items.length !== 1 ? 's' : ''} in this category. `;

    if (topTopic) {
        summary += `Most relate to ${topTopic[0].toLowerCase()} issues. `;
    }

    if (criticalCount > 0) {
        summary += `${criticalCount} high-priority item${criticalCount !== 1 ? 's' : ''} require attention.`;
    }

    return summary;
}

/**
 * Renders all AI category groups
 */
function renderAICategoryGroups() {
    const container = document.getElementById('aiCategoryGroups');
    if (!container) return;

    // Group feedback by product_area
    const groups = groupFeedbackByProductArea();

    // Color mapping for product areas
    const areaColors = {
        'Cards': '#3b82f6',
        'Payments': '#10b981',
        'OnboardingKYC': '#f59e0b',
        'Support': '#f97316',
        'AppUX': '#8b5cf6',
        'PricingFees': '#ef4444',
        'Security': '#dc2626',
        'ReliabilityPerformance': '#06b6d4'
    };

    // Filter groups with items
    const nonEmptyGroups = Object.entries(groups)
        .filter(([area, items]) => items.length > 0)
        .sort((a, b) => b[1].length - a[1].length);

    if (nonEmptyGroups.length === 0) {
        container.innerHTML = `
            <div class="ai-empty-state">
                <i class="fas fa-robot"></i>
                <p>No classified feedback yet. Submit feedback to see AI-powered insights.</p>
            </div>
        `;
        return;
    }

    // Render groups
    container.innerHTML = nonEmptyGroups.map(([area, items]) => {
        const color = areaColors[area] || '#9ca3af';
        const trend = calculateTrend(items);
        const summary = generateCategorySummary(items);
        const features = groupByFeatureLabel(items);
        const categoryId = area.toLowerCase().replace(/\s+/g, '-');

        return `
            <div class="ai-category-group" id="group-${categoryId}">
                <div class="ai-category-header" onclick="toggleAICategory('${categoryId}')">
                    <div class="ai-category-left">
                        <i class="fas fa-chevron-right expand-icon"></i>
                        <div class="ai-category-dot" style="background: ${color};"></div>
                        <span class="ai-category-name">${escapeHtml(area)}</span>
                        <span class="ai-category-badge">${items.length} item${items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="ai-category-right">
                        ${trend.count > 0 ? `
                            <div class="ai-trend-indicator positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>+${trend.count} this week</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="ai-category-content hidden" id="category-${categoryId}">
                    <div class="ai-category-summary">
                        <div class="ai-summary-text">
                            <i class="fas fa-robot"></i>
                            <p>${escapeHtml(summary)}</p>
                        </div>
                        <button class="ai-regenerate-btn" onclick="event.stopPropagation(); regenerateSummary('${area}')">
                            <i class="fas fa-sync-alt"></i> Regenerate
                        </button>
                    </div>
                    <div class="ai-subcategory-list">
                        ${Object.entries(features).map(([feature, count]) => `
                            <div class="ai-subcategory-item">
                                <span class="ai-subcategory-name">${escapeHtml(feature)}</span>
                                <span class="ai-subcategory-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="ai-feedback-items">
                        ${items.slice(0, 5).map(item => renderAIFeedbackItem(item)).join('')}
                        ${items.length > 5 ? `
                            <div class="ai-show-more" onclick="showAllInCategory('${area}')">
                                Show all ${items.length} items
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renders a compact feedback item for the AI summary
 */
function renderAIFeedbackItem(item) {
    const confidence = item.aiLabels?.confidence || 0;
    const confidencePercent = Math.round(confidence * 100);
    const isLowConfidence = confidence < AI_LABEL_CONFIG.confidenceThreshold;

    return `
        <div class="ai-feedback-item" onclick="openFeedbackDetail('${item.id}')">
            <div class="ai-feedback-confidence">
                <div class="confidence-bar ${isLowConfidence ? 'low' : ''}" style="width: ${confidencePercent}%"></div>
            </div>
            <div class="ai-feedback-title">${escapeHtml(item.title)}</div>
            <div class="ai-feedback-meta">
                <span class="badge badge-${item.priority}">${formatPriority(item.priority)}</span>
                ${item.aiLabels?.needs_review ? '<span class="needs-review-badge"><i class="fas fa-exclamation"></i> Review</span>' : ''}
                <span class="ai-feedback-date">${formatDate(item.submittedAt)}</span>
            </div>
            <div class="ai-feedback-labels">
                ${item.aiLabels?.topic ? `<span class="ai-label">${escapeHtml(item.aiLabels.topic)}</span>` : ''}
                ${item.aiLabels?.subtopic ? `<span class="ai-label">${escapeHtml(item.aiLabels.subtopic)}</span>` : ''}
            </div>
        </div>
    `;
}

/**
 * Toggles expansion of an AI category group
 */
function toggleAICategory(categoryId) {
    const group = document.getElementById(`group-${categoryId}`);
    const content = document.getElementById(`category-${categoryId}`);

    if (!group || !content) return;

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        group.classList.add('expanded');
    } else {
        content.classList.add('hidden');
        group.classList.remove('expanded');
    }
}

/**
 * Regenerates summary for a category
 */
function regenerateSummary(area) {
    const groups = groupFeedbackByProductArea();
    const items = groups[area] || [];
    const newSummary = generateCategorySummary(items);

    // Update the summary text
    const categoryId = area.toLowerCase().replace(/\s+/g, '-');
    const summaryElement = document.querySelector(`#category-${categoryId} .ai-summary-text p`);
    if (summaryElement) {
        summaryElement.textContent = newSummary;
    }

    showInAppNotification('Summary regenerated', `Updated summary for ${area}`);
}

/**
 * Shows all items in a category (switches to feedback tab with filter)
 */
function showAllInCategory(area) {
    // For now, just switch to feedback tab
    // In future, could add filtering
    switchAdminTab('feedback');
    showInAppNotification('Category: ' + area, `Showing all feedback items`);
}

/**
 * Formats priority for display
 */
function formatPriority(priority) {
    const priorityMap = {
        'critical': 'Critical',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
    };
    return priorityMap[priority] || priority;
}

// Intercept console methods to capture logs
(function() {
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };

    function captureLog(type, args) {
        const logEntry = {
            type: type,
            message: Array.from(args).map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' '),
            timestamp: new Date().toISOString()
        };
        consoleLogs.push(logEntry);
        if (consoleLogs.length > maxConsoleLogs) {
            consoleLogs.shift();
        }
    }

    console.log = function() {
        captureLog('log', arguments);
        originalConsole.log.apply(console, arguments);
    };
    console.error = function() {
        captureLog('error', arguments);
        originalConsole.error.apply(console, arguments);
    };
    console.warn = function() {
        captureLog('warn', arguments);
        originalConsole.warn.apply(console, arguments);
    };
    console.info = function() {
        captureLog('info', arguments);
        originalConsole.info.apply(console, arguments);
    };
})();

// Get recent console logs
function getRecentConsoleLogs() {
    return [...consoleLogs].slice(-20);
}

// ===== CHAT WIDGET =====

// Toggle chat widget popup
function toggleChatWidget() {
    const popup = document.getElementById('chatWidgetPopup');
    if (popup.classList.contains('active')) {
        closeChatWidget();
    } else {
        openChatWidget();
    }
}

// Open chat widget popup
function openChatWidget() {
    const popup = document.getElementById('chatWidgetPopup');
    popup.style.display = 'block';
    popup.classList.add('active');
}

// Close chat widget popup
function closeChatWidget() {
    const popup = document.getElementById('chatWidgetPopup');
    popup.classList.remove('active');
    popup.style.display = 'none';
}

// Open feedback modal from chat widget
function openFeedbackFromChat() {
    closeChatWidget();
    openFeedbackModal();
}

// Open messaging (placeholder - could integrate with actual messaging system)
function openMessaging() {
    alert('Messaging feature would open here. This is a placeholder for the actual messaging integration.');
}

// Track selected category for widget
let widgetSelectedCategory = '';

// Show feedback categories in widget
function showFeedbackCategories() {
    document.getElementById('chatWidgetHome').style.display = 'none';
    document.getElementById('chatWidgetFeedback').style.display = 'block';
    document.getElementById('chatWidgetForm').style.display = 'none';
    document.getElementById('chatWidgetHeader').style.display = 'none';
}

// Select category and show form in widget
function selectCategoryInWidget(category) {
    widgetSelectedCategory = category;

    document.getElementById('chatWidgetHome').style.display = 'none';
    document.getElementById('chatWidgetFeedback').style.display = 'none';
    document.getElementById('chatWidgetForm').style.display = 'block';
    document.getElementById('chatWidgetHeader').style.display = 'none';

    const descriptionLabel = document.getElementById('chatDescriptionLabel');
    const descriptionField = document.getElementById('chatFeedbackDescription');
    const bugSeverityGroup = document.getElementById('chatBugSeverityGroup');

    const formTitle = document.getElementById('chatWidgetFormTitle');

    if (category === 'feature') {
        formTitle.textContent = 'Feature request';
        descriptionLabel.textContent = 'Describe the feature and why you need it';
        descriptionField.placeholder = 'What would you like to see and why?';
        bugSeverityGroup.style.display = 'none';
    } else if (category === 'improvement') {
        formTitle.textContent = 'Improvement';
        descriptionLabel.textContent = "What's frustrating or unclear?";
        descriptionField.placeholder = 'Tell us what could be better...';
        bugSeverityGroup.style.display = 'none';
    } else if (category === 'bug') {
        formTitle.textContent = 'Report a bug';
        descriptionLabel.textContent = "What's broken or not working as expected?";
        descriptionField.placeholder = 'Describe what happened...';
        bugSeverityGroup.style.display = 'block';
    }
}

// Show home view in widget
function showChatWidgetHome() {
    document.getElementById('chatWidgetHome').style.display = 'block';
    document.getElementById('chatWidgetFeedback').style.display = 'none';
    document.getElementById('chatWidgetForm').style.display = 'none';
    document.getElementById('chatWidgetHeader').style.display = 'block';

    // Reset form
    document.getElementById('chatFeedbackForm').reset();
    document.getElementById('chatScreenshotPreview').style.display = 'none';
    widgetScreenshotData = null;
}

// Screenshot data for widget
let widgetScreenshotData = null;

// Track if screenshot was initiated from widget
let screenshotFromWidget = false;

// Start screenshot from widget
function startScreenshotFromWidget() {
    screenshotFromWidget = true;

    // Hide the chat widget
    document.getElementById('chatWidgetPopup').style.display = 'none';

    // Enable privacy blur
    enablePrivacyBlur();

    setTimeout(() => {
        const overlay = document.getElementById('screenshotOverlay');
        overlay.classList.add('active');

        // Setup event listeners (reuse existing ones)
        overlay.addEventListener('mousedown', startSelection);
        overlay.addEventListener('mousemove', updateSelection);
        overlay.addEventListener('mouseup', endSelection);
    }, 100);
}

// Retake screenshot in widget
function retakeScreenshotWidget() {
    widgetScreenshotData = null;
    document.getElementById('chatScreenshotPreview').style.display = 'none';
    startScreenshotFromWidget();
}

// Remove screenshot in widget
function removeScreenshotWidget() {
    widgetScreenshotData = null;
    document.getElementById('chatScreenshotPreview').style.display = 'none';
}

// Submit feedback from widget
function submitFeedbackFromWidget(event) {
    if (event) {
        event.preventDefault();
    }

    const submitBtn = document.querySelector('.chat-widget-submit-btn');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const category = widgetSelectedCategory || 'general';
        const description = document.getElementById('chatFeedbackDescription').value;

        let severity = 'medium';
        if (category === 'bug') {
            const bugSeverityValue = document.getElementById('chatBugSeverity').value;
            if (bugSeverityValue === 'blocks') {
                severity = 'critical';
            } else if (bugSeverityValue === 'slows') {
                severity = 'high';
            }
        }

        const title = description ? (description.substring(0, 50) + (description.length > 50 ? '...' : '')) : 'Feedback';

        // Auto-collect user info from signed-in user
        const userInfo = getCurrentUserInfo();

        const feedbackItem = {
            id: 'fb' + Date.now(),
            ticketId: generateTicketId(),
            title: title,
            category: category,
            priority: severity,
            description: description,
            clientId: userInfo.clientId,
            clientEmail: userInfo.email,
            clientName: userInfo.name,
            platform: 'web',
            screenshotUrl: widgetScreenshotData,
            sessionContext: getSessionContext(),
            consoleLogs: getRecentConsoleLogs(),
            status: 'open',
            submittedAt: new Date().toISOString(),
            comments: []
        };

        // AI Classification
        feedbackItem.aiLabels = classifyFeedback(feedbackItem);

        feedbackItems.push(feedbackItem);
        saveFeedbackToStorage();
        updateDashboard();

        console.log('📝 Feedback submitted:', feedbackItem.ticketId);
        console.log('🤖 AI Labels:', feedbackItem.aiLabels);

        // Reset to home view first, then close widget
        showChatWidgetHome();

        // Close widget
        const popup = document.getElementById('chatWidgetPopup');
        popup.classList.remove('active');
        popup.style.display = 'none';

        // Reset form
        document.getElementById('chatFeedbackForm').reset();
        widgetScreenshotData = null;
        widgetSelectedCategory = '';

        showInAppNotification('Thank you for your feedback!', 'Ticket ID: ' + feedbackItem.ticketId);

    } catch (error) {
        console.error('Error submitting feedback:', error);
        closeChatWidget();
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit feedback';
    }
}

// Load from localStorage on startup
function loadFeedbackFromStorage() {
    const stored = localStorage.getItem('feedbackItems');
    if (stored) {
        feedbackItems = JSON.parse(stored);
        updateDashboard();
    }
}

// Save to localStorage
function saveFeedbackToStorage() {
    localStorage.setItem('feedbackItems', JSON.stringify(feedbackItems));
}

// Generate ticket ID
function generateTicketId() {
    const prefix = 'FB';
    const number = String(feedbackItems.length + 1).padStart(5, '0');
    return `${prefix}-${number}`;
}

// Get current signed-in user info (auto-collected)
function getCurrentUserInfo() {
    // In production, this would get the actual signed-in user data
    // For demo purposes, returning mock user data
    return {
        clientId: 'CLT-001234',
        email: 'demo.user@exante.com',
        name: 'Demo User'
    };
}

// Get current session context
function getSessionContext() {
    return {
        url: window.location.href,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString()
    };
}

// Capture screenshot using html2canvas (simulated for demo)
async function captureScreenshot() {
    // In production, this would use html2canvas library
    // For demo purposes, we'll simulate the screenshot capture with privacy blur

    console.log('📸 Capturing screenshot with privacy protection...');

    // Ensure privacy blur is active
    enablePrivacyBlur();

    return new Promise((resolve) => {
        setTimeout(() => {
            // In real implementation:
            // html2canvas(document.body).then(canvas => {
            //     const screenshot = canvas.toDataURL('image/png');
            //     resolve(screenshot);
            // });

            // For demo, return placeholder
            resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
            console.log('✅ Screenshot captured with blurred sensitive data');
        }, 500);
    });
}

// Screenshot selection state
let screenshotData = null;
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionBox = null;

// Start screenshot selection mode
function startScreenshotSelection() {
    // Enable privacy blur first
    enablePrivacyBlur();

    // Small delay to let blur render
    setTimeout(() => {
        const overlay = document.getElementById('screenshotOverlay');
        overlay.classList.add('active');

        // Close feedback modal temporarily
        document.getElementById('feedbackModal').style.display = 'none';

        // Setup event listeners
        overlay.addEventListener('mousedown', startSelection);
        overlay.addEventListener('mousemove', updateSelection);
        overlay.addEventListener('mouseup', endSelection);
    }, 100);
}

function startSelection(e) {
    // Don't start new selection if clicking on existing selection box or its children
    if (selectionBox && (e.target === selectionBox || selectionBox.contains(e.target))) {
        return;
    }

    // Remove existing selection box if any
    if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
    }

    isSelecting = true;
    selectionStart = { x: e.clientX, y: e.clientY };

    // Create selection box
    selectionBox = document.createElement('div');
    selectionBox.className = 'screenshot-selection';
    selectionBox.style.left = e.clientX + 'px';
    selectionBox.style.top = e.clientY + 'px';

    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'screenshot-toolbar';
    toolbar.innerHTML = `
        <button class="btn-capture" onclick="event.stopPropagation(); captureSelection()">📸 Capture</button>
        <button class="btn-cancel" onclick="event.stopPropagation(); cancelScreenshot()">✕ Cancel</button>
    `;
    selectionBox.appendChild(toolbar);

    document.getElementById('screenshotOverlay').appendChild(selectionBox);

    // Hide instructions
    document.querySelector('.screenshot-instructions').style.display = 'none';
}

function updateSelection(e) {
    if (!isSelecting || !selectionBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);
    const left = Math.min(currentX, selectionStart.x);
    const top = Math.min(currentY, selectionStart.y);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
}

function endSelection(e) {
    if (!isSelecting) return;
    isSelecting = false;
}

function captureSelection() {
    if (!selectionBox) return;

    const rect = selectionBox.getBoundingClientRect();

    // Get the capture area in viewport coordinates (getBoundingClientRect returns viewport coords)
    const captureArea = {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
    };

    console.log('📸 Capturing real screenshot of region:', captureArea);

    // Collect positions of sensitive elements relative to the capture area
    // Query ALL sensitive-data elements in the document
    const sensitiveElements = document.querySelectorAll('.sensitive-data');
    const blurRegions = [];

    // Add padding to ensure complete coverage of sensitive data
    const blurPadding = 2;

    console.log('🔍 Total sensitive elements on page:', sensitiveElements.length);

    sensitiveElements.forEach(el => {
        // Skip if element is not visible
        if (el.offsetParent === null && getComputedStyle(el).display === 'none') {
            return;
        }

        const elRect = el.getBoundingClientRect();

        // Skip elements with zero dimensions
        if (elRect.width === 0 || elRect.height === 0) {
            return;
        }

        // Check if element overlaps with the capture area (using viewport coordinates)
        if (elRect.right > captureArea.left && elRect.left < captureArea.right &&
            elRect.bottom > captureArea.top && elRect.top < captureArea.bottom) {

            // Calculate position relative to capture area with padding
            const x = Math.max(0, elRect.left - captureArea.left - blurPadding);
            const y = Math.max(0, elRect.top - captureArea.top - blurPadding);
            const rightEdge = Math.min(elRect.right + blurPadding, captureArea.right) - captureArea.left;
            const bottomEdge = Math.min(elRect.bottom + blurPadding, captureArea.bottom) - captureArea.top;

            const region = {
                x: x,
                y: y,
                width: rightEdge - x,
                height: bottomEdge - y
            };

            // Only add if region has valid dimensions
            if (region.width > 0 && region.height > 0) {
                blurRegions.push(region);
                console.log('🔒 Sensitive element found:', el.textContent.trim().substring(0, 25), 'at', region);
            }
        }
    });

    console.log('🔒 Found', blurRegions.length, 'sensitive regions to blur within selection');

    // Hide the overlay temporarily to capture clean screenshot
    const overlay = document.getElementById('screenshotOverlay');
    overlay.style.visibility = 'hidden';

    // Use html2canvas to capture the actual visible content
    // html2canvas expects document coordinates (with scroll offset)
    html2canvas(document.body, {
        x: captureArea.left + window.scrollX,
        y: captureArea.top + window.scrollY,
        width: captureArea.width,
        height: captureArea.height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        scale: 1
    }).then(canvas => {
        console.log('✅ Real screenshot captured:', canvas.width, 'x', canvas.height);

        // Restore overlay visibility
        overlay.style.visibility = 'visible';

        // Apply permanent blur to sensitive regions in the canvas
        if (blurRegions.length > 0) {
            const ctx = canvas.getContext('2d');
            console.log('🔲 Applying blur to', blurRegions.length, 'regions...');
            blurRegions.forEach((region, index) => {
                console.log(`🔲 Blurring region ${index + 1}:`, region);
                applyPermanentBlur(ctx, region.x, region.y, region.width, region.height);
            });
            console.log('🔒 Applied permanent blur to', blurRegions.length, 'sensitive regions');
        } else {
            console.log('⚠️ No sensitive regions found to blur');
        }

        const screenshotImage = canvas.toDataURL('image/png');
        openAnnotationEditor(screenshotImage);
        cleanupScreenshotMode();
    }).catch(error => {
        console.error('❌ Screenshot capture failed:', error);

        // Restore overlay visibility
        overlay.style.visibility = 'visible';

        // Fallback to placeholder if html2canvas fails
        const fallbackCanvas = document.createElement('canvas');
        const ctx = fallbackCanvas.getContext('2d');
        fallbackCanvas.width = rect.width;
        fallbackCanvas.height = rect.height;

        const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, rect.width, rect.height);

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Screenshot capture failed', rect.width / 2, rect.height / 2 - 10);
        ctx.font = '12px Arial';
        ctx.fillText('Using placeholder image', rect.width / 2, rect.height / 2 + 10);

        const screenshotImage = fallbackCanvas.toDataURL('image/png');
        openAnnotationEditor(screenshotImage);
        cleanupScreenshotMode();
    });
}

// Apply permanent smooth Gaussian blur effect to a region of the canvas
function applyPermanentBlur(ctx, x, y, width, height) {
    if (width < 1 || height < 1) return;

    // Round coordinates to avoid sub-pixel issues
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    // Make sure we don't exceed canvas bounds
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    if (x < 0) { width += x; x = 0; }
    if (y < 0) { height += y; y = 0; }
    if (x + width > canvasWidth) width = canvasWidth - x;
    if (y + height > canvasHeight) height = canvasHeight - y;

    if (width < 1 || height < 1) return;

    // Use multiple passes of box blur to approximate Gaussian blur
    const radius = 8;
    const passes = 3; // Multiple passes create smoother result

    // Get image data
    const imageData = ctx.getImageData(x, y, width, height);

    // Apply box blur multiple times
    for (let p = 0; p < passes; p++) {
        boxBlurH(imageData.data, width, height, radius);
        boxBlurV(imageData.data, width, height, radius);
    }

    // Put the blurred data back
    ctx.putImageData(imageData, x, y);
}

// Horizontal box blur pass
function boxBlurH(data, w, h, r) {
    const newData = new Uint8ClampedArray(data.length);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;

            for (let ix = x - r; ix <= x + r; ix++) {
                if (ix >= 0 && ix < w) {
                    const idx = (y * w + ix) * 4;
                    rSum += data[idx];
                    gSum += data[idx + 1];
                    bSum += data[idx + 2];
                    aSum += data[idx + 3];
                    count++;
                }
            }

            const idx = (y * w + x) * 4;
            newData[idx] = rSum / count;
            newData[idx + 1] = gSum / count;
            newData[idx + 2] = bSum / count;
            newData[idx + 3] = aSum / count;
        }
    }

    // Copy back to original array
    for (let i = 0; i < data.length; i++) {
        data[i] = newData[i];
    }
}

// Vertical box blur pass
function boxBlurV(data, w, h, r) {
    const newData = new Uint8ClampedArray(data.length);

    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;

            for (let iy = y - r; iy <= y + r; iy++) {
                if (iy >= 0 && iy < h) {
                    const idx = (iy * w + x) * 4;
                    rSum += data[idx];
                    gSum += data[idx + 1];
                    bSum += data[idx + 2];
                    aSum += data[idx + 3];
                    count++;
                }
            }

            const idx = (y * w + x) * 4;
            newData[idx] = rSum / count;
            newData[idx + 1] = gSum / count;
            newData[idx + 2] = bSum / count;
            newData[idx + 3] = aSum / count;
        }
    }

    // Copy back to original array
    for (let i = 0; i < data.length; i++) {
        data[i] = newData[i];
    }
}

function showScreenshotPreview(imageData) {
    const preview = document.getElementById('screenshotPreviewContainer');
    const img = document.getElementById('screenshotPreviewImage');

    img.src = imageData;
    preview.classList.add('active');
}

function cleanupScreenshotMode() {
    const overlay = document.getElementById('screenshotOverlay');
    overlay.classList.remove('active');

    // Remove selection box
    if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
    }

    // Show instructions again
    const instructions = document.querySelector('.screenshot-instructions');
    if (instructions) {
        instructions.style.display = 'block';
    }

    // Don't show modal here - will be shown after annotation editor

    // Disable privacy blur
    disablePrivacyBlur();

    // Remove event listeners
    overlay.removeEventListener('mousedown', startSelection);
    overlay.removeEventListener('mousemove', updateSelection);
    overlay.removeEventListener('mouseup', endSelection);

    isSelecting = false;
}

function cancelScreenshot() {
    cleanupScreenshotMode();
}

function retakeScreenshot() {
    screenshotData = null;
    document.getElementById('screenshotPreviewContainer').classList.remove('active');
    startScreenshotSelection();
}

function removeScreenshot() {
    screenshotData = null;
    document.getElementById('screenshotPreviewContainer').classList.remove('active');
}

// Enable privacy blur for sensitive data
function enablePrivacyBlur() {
    // Blur all elements with sensitive-data class
    const sensitiveElements = document.querySelectorAll('.sensitive-data');
    sensitiveElements.forEach(el => {
        el.classList.add('privacy-blur');
    });

    // Also blur account numbers if present
    const accountNumbers = document.querySelectorAll('.account-number');
    accountNumbers.forEach(el => {
        el.classList.add('privacy-blur');
    });

    console.log('🔒 Privacy mode enabled - sensitive data blurred');
}

// Disable privacy blur
function disablePrivacyBlur() {
    const blurredElements = document.querySelectorAll('.privacy-blur');
    blurredElements.forEach(el => {
        el.classList.remove('privacy-blur');
    });

    console.log('🔓 Privacy mode disabled');
}

// Track selected category
let selectedCategory = '';

// Open feedback modal
function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'block';
    modal.classList.add('active');
    // Show category selection first
    showCategorySelection();
    // Reset form
    document.getElementById('feedbackForm').reset();
    document.getElementById('successMessage').classList.remove('active');
}

// Close feedback modal
function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    // Reset to category selection
    showCategorySelection();
    // Disable privacy blur when closing modal
    disablePrivacyBlur();
}

// Show category selection screen
function showCategorySelection() {
    document.getElementById('categorySelection').style.display = 'flex';
    document.getElementById('feedbackForm').style.display = 'none';
    document.getElementById('modalTitle').textContent = 'What are you looking for?';
}

// Select category and show form
function selectCategory(category) {
    selectedCategory = category;

    // Hide category selection, show form
    document.getElementById('categorySelection').style.display = 'none';
    document.getElementById('feedbackForm').style.display = 'block';

    // Update modal title and description label based on category
    const descriptionLabel = document.getElementById('descriptionLabel');
    const descriptionField = document.getElementById('feedbackDescription');
    const bugSeverityGroup = document.getElementById('bugSeverityGroup');

    if (category === 'feature') {
        document.getElementById('modalTitle').textContent = 'Feature request';
        descriptionLabel.textContent = 'Describe the feature and why you need it';
        descriptionField.placeholder = 'What would you like to see and why?';
        bugSeverityGroup.style.display = 'none';
    } else if (category === 'improvement') {
        document.getElementById('modalTitle').textContent = 'Improvement';
        descriptionLabel.textContent = "What's frustrating or unclear?";
        descriptionField.placeholder = 'Tell us what could be better...';
        bugSeverityGroup.style.display = 'none';
    } else if (category === 'bug') {
        document.getElementById('modalTitle').textContent = 'Bug';
        descriptionLabel.textContent = "What's broken or not working as expected?";
        descriptionField.placeholder = 'Describe what happened...';
        bugSeverityGroup.style.display = 'block';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('feedbackModal');
    if (e.target === modal) {
        closeFeedbackModal();
    }
});

// Submit feedback
function submitFeedback(event) {
    if (event) {
        event.preventDefault();
    }

    console.log('📝 Submitting feedback...');

    const submitBtn = document.getElementById('submitBtn');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Get form values
        const category = selectedCategory || 'general';
        const descriptionEl = document.getElementById('feedbackDescription');
        const description = descriptionEl ? descriptionEl.value : '';

        // Get bug severity if it's a bug
        let severity = 'medium';
        if (category === 'bug') {
            const bugSeveritySelect = document.getElementById('bugSeverity');
            if (bugSeveritySelect) {
                const bugSeverityValue = bugSeveritySelect.value;
                if (bugSeverityValue === 'blocks') {
                    severity = 'critical';
                } else if (bugSeverityValue === 'slows') {
                    severity = 'high';
                }
            }
        }

        // Use the manually captured screenshot if available
        let screenshotUrl = screenshotData;

        // Generate title from description (first 50 chars)
        const title = description ? (description.substring(0, 50) + (description.length > 50 ? '...' : '')) : 'Feedback';

        // Create feedback item
        // Auto-collect user info from signed-in user
        const userInfo = getCurrentUserInfo();

        const feedbackItem = {
            id: 'fb' + Date.now(),
            ticketId: generateTicketId(),
            title: title,
            category: category,
            priority: severity,
            description: description,
            clientId: userInfo.clientId,
            clientEmail: userInfo.email,
            clientName: userInfo.name,
            platform: 'web',
            screenshotUrl: screenshotUrl,
            sessionContext: getSessionContext(),
            status: 'open',
            submittedAt: new Date().toISOString(),
            comments: []
        };

        // AI Classification
        feedbackItem.aiLabels = classifyFeedback(feedbackItem);

        // Add to storage
        feedbackItems.push(feedbackItem);
        saveFeedbackToStorage();

        // Update dashboard
        updateDashboard();

        console.log('✅ Feedback saved:', feedbackItem.ticketId);
        console.log('🤖 AI Labels:', feedbackItem.aiLabels);

        // Close modal immediately
        closeFeedbackModal();

        // Reset form and state
        document.getElementById('feedbackForm').reset();
        screenshotData = null;
        selectedCategory = '';
        document.getElementById('screenshotPreviewContainer').classList.remove('active');

        // Show success notification
        showInAppNotification('Thank you for your feedback!', 'Ticket ID: ' + feedbackItem.ticketId);
    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        closeFeedbackModal();
    } finally {
        // Always reset submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit feedback';
    }
}

// Update dashboard stats and list
function updateDashboard() {
    // Update stats
    document.getElementById('totalFeedback').textContent = feedbackItems.length;
    document.getElementById('openFeedback').textContent = feedbackItems.filter(f => f.status === 'open').length;
    document.getElementById('inProgressFeedback').textContent = feedbackItems.filter(f => f.status === 'in_progress').length;
    document.getElementById('resolvedFeedback').textContent = feedbackItems.filter(f => f.status === 'resolved').length;

    // Update feedback list
    const feedbackList = document.getElementById('feedbackList');

    if (feedbackItems.length === 0) {
        feedbackList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>No feedback submitted yet. Try submitting one using the widget!</p>
            </div>
        `;
        return;
    }

    // Sort by most recent first
    const sortedFeedback = [...feedbackItems].reverse();

    feedbackList.innerHTML = sortedFeedback.map(item => `
        <div class="feedback-item" onclick="openFeedbackDetail('${item.id}')" style="cursor: pointer;">
            <div class="feedback-item-header">
                <div>
                    <div class="feedback-item-title">${escapeHtml(item.title)}</div>
                    <div style="font-size: 0.875rem; color: #9ca3af; margin-top: 0.25rem;">
                        Ticket: ${item.ticketId}
                    </div>
                </div>
            </div>

            <div class="feedback-item-meta">
                <span class="badge badge-${item.status}">${formatStatus(item.status)}</span>
                <span class="badge badge-${item.priority}">${formatPriority(item.priority)}</span>
                <span class="badge" style="background: #f3f4f6; color: #4b5563;">${getCategoryIcon(item.category)} ${formatCategory(item.category)}</span>
            </div>

            <div class="feedback-item-description">
                ${escapeHtml(item.description)}
            </div>

            ${item.screenshotUrl ? '<div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">📷 Screenshot attached</div>' : ''}
            ${item.consoleLogs && item.consoleLogs.length > 0 ? '<div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">📋 ' + item.consoleLogs.length + ' console logs</div>' : ''}
            ${item.jiraTicketId ? '<div style="color: #0052CC; font-size: 0.875rem; margin-bottom: 0.5rem;"><svg style="display:inline;vertical-align:middle;margin-right:4px;" width="14" height="14" viewBox="0 0 24 24" fill="#0052CC"><path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84H11.53zM6.77 6.8a4.36 4.36 0 0 0 4.34 4.34h1.8v1.72a4.36 4.36 0 0 0 4.34 4.34V7.63a.84.84 0 0 0-.83-.83H6.77zM2 11.6c0 2.4 1.95 4.34 4.35 4.34h1.78v1.72c.01 2.39 1.95 4.34 4.35 4.34v-9.57a.84.84 0 0 0-.84-.83H2z"/></svg>' + item.jiraTicketId + '</div>' : ''}

            <div class="feedback-item-footer">
                <div>
                    👤 ${escapeHtml(item.clientName || 'User')}
                </div>
                <div>
                    🕐 ${formatDate(item.submittedAt)}
                </div>
            </div>
        </div>
    `).join('');
}

// Open feedback detail modal
function openFeedbackDetail(feedbackId) {
    const item = feedbackItems.find(f => f.id === feedbackId);
    if (!item) return;

    // Remove existing modal if any
    const existing = document.getElementById('feedbackDetailModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'feedbackDetailModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.onclick = function(e) { if (e.target === modal) closeFeedbackDetail(); };

    const sessionContext = item.sessionContext || {};
    const consoleLogs = item.consoleLogs || [];

    modal.innerHTML = `
        <div style="background:#1e2427;border-radius:16px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;color:#dbe1e2;">
            <div style="padding:24px;border-bottom:1px solid #3a4245;">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div>
                        <h2 style="margin:0 0 8px 0;font-size:20px;">${escapeHtml(item.title)}</h2>
                        <div style="color:#9ca3af;font-size:14px;">Ticket: ${item.ticketId}</div>
                    </div>
                    <button onclick="closeFeedbackDetail()" style="background:none;border:none;color:#9ca3af;font-size:28px;cursor:pointer;line-height:1;">&times;</button>
                </div>
                <div style="display:flex;gap:8px;margin-top:12px;">
                    <span class="badge badge-${item.status}">${formatStatus(item.status)}</span>
                    <span class="badge badge-${item.priority}">${formatPriority(item.priority)}</span>
                    <span class="badge" style="background:#3a4245;color:#dbe1e2;">${getCategoryIcon(item.category)} ${formatCategory(item.category)}</span>
                </div>
            </div>

            <div style="padding:24px;">
                <!-- Description -->
                <div style="margin-bottom:24px;">
                    <h3 style="margin:0 0 12px 0;font-size:14px;color:#9ca3af;text-transform:uppercase;">Description</h3>
                    <p style="margin:0;line-height:1.6;color:#dbe1e2;">${escapeHtml(item.description)}</p>
                </div>

                <!-- User Info -->
                <div style="margin-bottom:24px;">
                    <h3 style="margin:0 0 12px 0;font-size:14px;color:#9ca3af;text-transform:uppercase;">User Information</h3>
                    <div style="background:#262d30;border-radius:8px;padding:16px;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                            <div><span style="color:#9ca3af;">Client ID:</span> ${escapeHtml(item.clientId || 'N/A')}</div>
                            <div><span style="color:#9ca3af;">Name:</span> ${escapeHtml(item.clientName || 'N/A')}</div>
                            <div><span style="color:#9ca3af;">Email:</span> ${escapeHtml(item.clientEmail || 'N/A')}</div>
                            <div><span style="color:#9ca3af;">Platform:</span> ${item.platform || 'web'}</div>
                            <div><span style="color:#9ca3af;">Submitted:</span> ${new Date(item.submittedAt).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <!-- Session Context -->
                <div style="margin-bottom:24px;">
                    <h3 style="margin:0 0 12px 0;font-size:14px;color:#9ca3af;text-transform:uppercase;">Session Context</h3>
                    <div style="background:#262d30;border-radius:8px;padding:16px;font-family:monospace;font-size:13px;">
                        <div style="margin-bottom:8px;"><span style="color:#9ca3af;">URL:</span> ${escapeHtml(sessionContext.url || 'N/A')}</div>
                        <div style="margin-bottom:8px;"><span style="color:#9ca3af;">User Agent:</span> ${escapeHtml(sessionContext.userAgent || 'N/A')}</div>
                        <div style="margin-bottom:8px;"><span style="color:#9ca3af;">Screen:</span> ${sessionContext.screenResolution || 'N/A'}</div>
                        <div style="margin-bottom:8px;"><span style="color:#9ca3af;">Language:</span> ${sessionContext.language || 'N/A'}</div>
                        <div><span style="color:#9ca3af;">Timestamp:</span> ${sessionContext.timestamp || 'N/A'}</div>
                    </div>
                </div>

                <!-- Screenshot -->
                ${item.screenshotUrl ? `
                <div style="margin-bottom:24px;">
                    <h3 style="margin:0 0 12px 0;font-size:14px;color:#9ca3af;text-transform:uppercase;">Screenshot</h3>
                    <div style="background:#262d30;border-radius:8px;padding:16px;">
                        <img src="${item.screenshotUrl}" style="max-width:100%;border-radius:8px;border:1px solid #3a4245;" alt="Screenshot">
                    </div>
                </div>
                ` : ''}

                <!-- Console Logs -->
                <div style="margin-bottom:24px;">
                    <h3 style="margin:0 0 12px 0;font-size:14px;color:#9ca3af;text-transform:uppercase;">Console Logs (${consoleLogs.length})</h3>
                    <div style="background:#0d1117;border-radius:8px;padding:16px;font-family:monospace;font-size:12px;max-height:300px;overflow-y:auto;">
                        ${consoleLogs.length > 0 ? consoleLogs.map(log => `
                            <div style="margin-bottom:8px;padding:4px 8px;border-radius:4px;background:${log.type === 'error' ? '#3d1f1f' : log.type === 'warn' ? '#3d3d1f' : '#1f2937'};">
                                <span style="color:${log.type === 'error' ? '#f87171' : log.type === 'warn' ? '#fbbf24' : '#60a5fa'};">[${log.type.toUpperCase()}]</span>
                                <span style="color:#9ca3af;margin-left:8px;">${new Date(log.timestamp).toLocaleTimeString()}</span>
                                <div style="color:#dbe1e2;margin-top:4px;word-break:break-all;">${escapeHtml(log.message)}</div>
                            </div>
                        `).join('') : '<div style="color:#9ca3af;">No console logs captured</div>'}
                    </div>
                </div>

                <!-- Jira Integration -->
                <div style="margin-bottom:24px;">
                    <h3 style="margin:0 0 12px 0;font-size:14px;color:#9ca3af;text-transform:uppercase;">Jira Integration</h3>
                    <div style="background:#262d30;border-radius:8px;padding:16px;">
                        ${item.jiraTicketId ? `
                            <div style="display:flex;align-items:center;gap:12px;">
                                <span style="color:#22c55e;">✓ Linked to Jira</span>
                                <a href="${item.jiraTicketUrl || '#'}" target="_blank" style="color:#3b82f6;text-decoration:none;font-weight:600;">${item.jiraTicketId}</a>
                                <button onclick="unlinkJiraTicket('${item.id}')" style="padding:6px 12px;background:#3a4245;color:#9ca3af;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Unlink</button>
                            </div>
                        ` : `
                            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                                <button onclick="openJiraModal('${item.id}')" style="padding:10px 16px;background:#0052CC;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84H11.53zM6.77 6.8a4.36 4.36 0 0 0 4.34 4.34h1.8v1.72a4.36 4.36 0 0 0 4.34 4.34V7.63a.84.84 0 0 0-.83-.83H6.77zM2 11.6c0 2.4 1.95 4.34 4.35 4.34h1.78v1.72c.01 2.39 1.95 4.34 4.35 4.34v-9.57a.84.84 0 0 0-.84-.83H2z"/></svg>
                                    Create Jira Ticket
                                </button>
                                <button onclick="openLinkJiraModal('${item.id}')" style="padding:10px 16px;background:#3a4245;color:#dbe1e2;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
                                    Link Existing Ticket
                                </button>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Actions -->
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button onclick="updateFeedbackStatus('${item.id}', 'in_progress')" style="padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Mark In Progress</button>
                    <button onclick="updateFeedbackStatus('${item.id}', 'resolved')" style="padding:10px 20px;background:#22c55e;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Mark Resolved</button>
                    <button onclick="deleteFeedback('${item.id}')" style="padding:10px 20px;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Delete</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Close feedback detail modal
function closeFeedbackDetail() {
    const modal = document.getElementById('feedbackDetailModal');
    if (modal) modal.remove();
}

// ===== JIRA INTEGRATION =====

// Jira configuration (in production, these would come from environment/settings)
const jiraConfig = {
    baseUrl: 'https://your-company.atlassian.net',
    projectKey: 'FEED',
    issueTypes: ['Bug', 'Story', 'Task', 'Improvement']
};

// Open modal to create new Jira ticket
function openJiraModal(feedbackId) {
    const item = feedbackItems.find(f => f.id === feedbackId);
    if (!item) return;

    // Remove existing modal if any
    const existing = document.getElementById('jiraModal');
    if (existing) existing.remove();

    // Map feedback category to Jira issue type
    const defaultIssueType = item.category === 'bug' ? 'Bug' :
                             item.category === 'feature' ? 'Story' : 'Improvement';

    const modal = document.createElement('div');
    modal.id = 'jiraModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.onclick = function(e) { if (e.target === modal) closeJiraModal(); };

    modal.innerHTML = `
        <div style="background:#1e2427;border-radius:16px;max-width:500px;width:100%;color:#dbe1e2;">
            <div style="padding:20px;border-bottom:1px solid #3a4245;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;font-size:18px;display:flex;align-items:center;gap:10px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0052CC"><path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84H11.53zM6.77 6.8a4.36 4.36 0 0 0 4.34 4.34h1.8v1.72a4.36 4.36 0 0 0 4.34 4.34V7.63a.84.84 0 0 0-.83-.83H6.77zM2 11.6c0 2.4 1.95 4.34 4.35 4.34h1.78v1.72c.01 2.39 1.95 4.34 4.35 4.34v-9.57a.84.84 0 0 0-.84-.83H2z"/></svg>
                    Create Jira Ticket
                </h3>
                <button onclick="closeJiraModal()" style="background:none;border:none;color:#9ca3af;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
            </div>
            <div style="padding:20px;">
                <form id="createJiraForm" onsubmit="createJiraTicket(event, '${feedbackId}')">
                    <div style="margin-bottom:16px;">
                        <label style="display:block;color:#9ca3af;font-size:13px;margin-bottom:6px;">Project</label>
                        <select id="jiraProject" style="width:100%;padding:10px 12px;background:#262d30;border:1px solid #3a4245;border-radius:8px;color:#dbe1e2;font-size:14px;">
                            <option value="FEED">FEED - Feedback</option>
                            <option value="PLAT">PLAT - Platform</option>
                            <option value="WEB">WEB - Web App</option>
                        </select>
                    </div>
                    <div style="margin-bottom:16px;">
                        <label style="display:block;color:#9ca3af;font-size:13px;margin-bottom:6px;">Issue Type</label>
                        <select id="jiraIssueType" style="width:100%;padding:10px 12px;background:#262d30;border:1px solid #3a4245;border-radius:8px;color:#dbe1e2;font-size:14px;">
                            <option value="Bug" ${defaultIssueType === 'Bug' ? 'selected' : ''}>Bug</option>
                            <option value="Story" ${defaultIssueType === 'Story' ? 'selected' : ''}>Story</option>
                            <option value="Task">Task</option>
                            <option value="Improvement" ${defaultIssueType === 'Improvement' ? 'selected' : ''}>Improvement</option>
                        </select>
                    </div>
                    <div style="margin-bottom:16px;">
                        <label style="display:block;color:#9ca3af;font-size:13px;margin-bottom:6px;">Summary</label>
                        <input type="text" id="jiraSummary" value="${escapeHtml(item.title)}" style="width:100%;padding:10px 12px;background:#262d30;border:1px solid #3a4245;border-radius:8px;color:#dbe1e2;font-size:14px;box-sizing:border-box;" required>
                    </div>
                    <div style="margin-bottom:16px;">
                        <label style="display:block;color:#9ca3af;font-size:13px;margin-bottom:6px;">Priority</label>
                        <select id="jiraPriority" style="width:100%;padding:10px 12px;background:#262d30;border:1px solid #3a4245;border-radius:8px;color:#dbe1e2;font-size:14px;">
                            <option value="Highest" ${item.priority === 'critical' ? 'selected' : ''}>Highest</option>
                            <option value="High" ${item.priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="Medium" ${item.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="Low" ${item.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="Lowest">Lowest</option>
                        </select>
                    </div>
                    <div style="margin-bottom:20px;">
                        <label style="display:flex;align-items:center;gap:8px;color:#dbe1e2;font-size:14px;cursor:pointer;">
                            <input type="checkbox" id="jiraIncludeDetails" checked style="width:16px;height:16px;accent-color:#0052CC;">
                            Include session context and console logs
                        </label>
                    </div>
                    <div style="display:flex;gap:12px;">
                        <button type="button" onclick="closeJiraModal()" style="flex:1;padding:12px;background:#3a4245;color:#dbe1e2;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
                        <button type="submit" id="createJiraBtn" style="flex:1;padding:12px;background:#0052CC;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Create Ticket</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Open modal to link existing Jira ticket
function openLinkJiraModal(feedbackId) {
    // Remove existing modal if any
    const existing = document.getElementById('jiraModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'jiraModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.onclick = function(e) { if (e.target === modal) closeJiraModal(); };

    modal.innerHTML = `
        <div style="background:#1e2427;border-radius:16px;max-width:450px;width:100%;color:#dbe1e2;">
            <div style="padding:20px;border-bottom:1px solid #3a4245;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;font-size:18px;display:flex;align-items:center;gap:10px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0052CC"><path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84H11.53zM6.77 6.8a4.36 4.36 0 0 0 4.34 4.34h1.8v1.72a4.36 4.36 0 0 0 4.34 4.34V7.63a.84.84 0 0 0-.83-.83H6.77zM2 11.6c0 2.4 1.95 4.34 4.35 4.34h1.78v1.72c.01 2.39 1.95 4.34 4.35 4.34v-9.57a.84.84 0 0 0-.84-.83H2z"/></svg>
                    Link Existing Ticket
                </h3>
                <button onclick="closeJiraModal()" style="background:none;border:none;color:#9ca3af;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
            </div>
            <div style="padding:20px;">
                <form id="linkJiraForm" onsubmit="linkJiraTicket(event, '${feedbackId}')">
                    <div style="margin-bottom:16px;">
                        <label style="display:block;color:#9ca3af;font-size:13px;margin-bottom:6px;">Jira Ticket ID</label>
                        <input type="text" id="jiraTicketIdInput" placeholder="e.g., FEED-123" style="width:100%;padding:10px 12px;background:#262d30;border:1px solid #3a4245;border-radius:8px;color:#dbe1e2;font-size:14px;box-sizing:border-box;" required pattern="[A-Z]+-[0-9]+" title="Format: PROJECT-123">
                    </div>
                    <div style="display:flex;gap:12px;">
                        <button type="button" onclick="closeJiraModal()" style="flex:1;padding:12px;background:#3a4245;color:#dbe1e2;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
                        <button type="submit" style="flex:1;padding:12px;background:#0052CC;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Link Ticket</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Close Jira modal
function closeJiraModal() {
    const modal = document.getElementById('jiraModal');
    if (modal) modal.remove();
}

// Create Jira ticket (simulated - in production would call Jira API)
function createJiraTicket(event, feedbackId) {
    event.preventDefault();

    const item = feedbackItems.find(f => f.id === feedbackId);
    if (!item) return;

    const btn = document.getElementById('createJiraBtn');
    btn.disabled = true;
    btn.textContent = 'Creating...';

    const project = document.getElementById('jiraProject').value;
    const issueType = document.getElementById('jiraIssueType').value;
    const summary = document.getElementById('jiraSummary').value;
    const priority = document.getElementById('jiraPriority').value;
    const includeDetails = document.getElementById('jiraIncludeDetails').checked;

    // Simulate API call delay
    setTimeout(() => {
        // Generate a mock Jira ticket ID
        const ticketNumber = Math.floor(Math.random() * 9000) + 1000;
        const jiraTicketId = `${project}-${ticketNumber}`;
        const jiraTicketUrl = `${jiraConfig.baseUrl}/browse/${jiraTicketId}`;

        // Update feedback item with Jira link
        item.jiraTicketId = jiraTicketId;
        item.jiraTicketUrl = jiraTicketUrl;
        item.jiraDetails = {
            project,
            issueType,
            summary,
            priority,
            includeDetails,
            createdAt: new Date().toISOString()
        };

        saveFeedbackToStorage();
        updateDashboard();

        closeJiraModal();
        closeFeedbackDetail();
        openFeedbackDetail(feedbackId);

        showInAppNotification('Jira ticket created!', jiraTicketId);
        console.log('🎫 Jira ticket created:', jiraTicketId);
    }, 1000);
}

// Link existing Jira ticket
function linkJiraTicket(event, feedbackId) {
    event.preventDefault();

    const item = feedbackItems.find(f => f.id === feedbackId);
    if (!item) return;

    const jiraTicketId = document.getElementById('jiraTicketIdInput').value.toUpperCase();
    const jiraTicketUrl = `${jiraConfig.baseUrl}/browse/${jiraTicketId}`;

    // Update feedback item with Jira link
    item.jiraTicketId = jiraTicketId;
    item.jiraTicketUrl = jiraTicketUrl;
    item.jiraDetails = {
        linkedAt: new Date().toISOString(),
        linkedManually: true
    };

    saveFeedbackToStorage();
    updateDashboard();

    closeJiraModal();
    closeFeedbackDetail();
    openFeedbackDetail(feedbackId);

    showInAppNotification('Linked to Jira!', jiraTicketId);
    console.log('🔗 Linked to Jira ticket:', jiraTicketId);
}

// Unlink Jira ticket
function unlinkJiraTicket(feedbackId) {
    if (!confirm('Remove the link to this Jira ticket?')) return;

    const item = feedbackItems.find(f => f.id === feedbackId);
    if (!item) return;

    const oldTicketId = item.jiraTicketId;
    delete item.jiraTicketId;
    delete item.jiraTicketUrl;
    delete item.jiraDetails;

    saveFeedbackToStorage();
    updateDashboard();

    closeFeedbackDetail();
    openFeedbackDetail(feedbackId);

    console.log('🔓 Unlinked Jira ticket:', oldTicketId);
}

// Update feedback status
function updateFeedbackStatus(feedbackId, newStatus) {
    const item = feedbackItems.find(f => f.id === feedbackId);
    if (item) {
        item.status = newStatus;
        saveFeedbackToStorage();
        updateDashboard();
        closeFeedbackDetail();
        openFeedbackDetail(feedbackId);
    }
}

// Delete feedback
function deleteFeedback(feedbackId) {
    if (confirm('Are you sure you want to delete this feedback?')) {
        feedbackItems = feedbackItems.filter(f => f.id !== feedbackId);
        saveFeedbackToStorage();
        updateDashboard();
        closeFeedbackDetail();
    }
}

// Reset to demo data
function resetToDemoData() {
    if (confirm('This will delete all current feedback and load demo data. Continue?')) {
        localStorage.removeItem('feedbackItems');
        feedbackItems = [];
        location.reload();
    }
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Format status
function formatStatus(status) {
    const statusMap = {
        'open': 'Open',
        'in_progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed'
    };
    return statusMap[status] || status;
}

// Utility: Format priority
function formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
}

// Utility: Format category
function formatCategory(category) {
    const categoryMap = {
        'bug': 'Bug Report',
        'feature_request': 'Feature Request',
        'improvement': 'Improvement',
        'question': 'Question'
    };
    return categoryMap[category] || category;
}

// Utility: Get category icon
function getCategoryIcon(category) {
    const iconMap = {
        'bug': '🐛',
        'feature_request': '💡',
        'improvement': '⚡',
        'question': '❓'
    };
    return iconMap[category] || '📝';
}

// Utility: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

// Show success toast notification
function showSuccessToast(message) {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;

    // Show toast
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show in-app notification - small toast style in bottom right corner
function showInAppNotification(title, message) {
    // Remove existing notification if any
    const existing = document.getElementById('inAppNotification');
    if (existing) {
        existing.remove();
    }

    // Add animation style if not already added
    if (!document.getElementById('toastAnimationStyle')) {
        const style = document.createElement('style');
        style.id = 'toastAnimationStyle';
        style.textContent = `
            @keyframes toastSlideIn {
                from { opacity: 0; transform: translateX(100px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes toastSlideOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Create small toast notification in bottom right
    const notification = document.createElement('div');
    notification.id = 'inAppNotification';
    notification.style.cssText = 'position:fixed;bottom:100px;right:30px;background:#fff;border-radius:12px;padding:16px 20px;z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;animation:toastSlideIn 0.3s ease;max-width:300px;';

    notification.innerHTML = '<div style="width:32px;height:32px;background:#1B8B4B;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div><div><div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px;">' + title + '</div><div style="font-size:12px;color:#666;">' + message + '</div></div>';

    document.body.appendChild(notification);

    // Auto-dismiss after 4 seconds
    setTimeout(function() {
        notification.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Close in-app notification
function closeInAppNotification() {
    const notification = document.getElementById('inAppNotification');
    if (notification) notification.remove();
}

// Show view (platform or admin)
function showView(viewId) {
    // Update toggle buttons
    document.querySelectorAll('.admin-toggle button').forEach(btn => btn.classList.remove('active'));

    // Find and activate the correct button
    const buttons = document.querySelectorAll('.admin-toggle button');
    buttons.forEach(btn => {
        if ((viewId === 'platform' && btn.textContent.includes('Platform')) ||
            (viewId === 'admin' && btn.textContent.includes('Admin'))) {
            btn.classList.add('active');
        }
    });

    // Update views
    if (viewId === 'platform') {
        document.getElementById('platformView').style.display = 'block';
        document.getElementById('adminView').classList.remove('active');
    } else {
        document.getElementById('platformView').style.display = 'none';
        document.getElementById('adminView').classList.add('active');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadFeedbackFromStorage();

    // Add some demo feedback items if empty
    if (feedbackItems.length === 0) {
        // Sample console logs for demo
        const sampleConsoleLogs1 = [
            { type: 'log', message: '📊 Loading chart data for AAPL...', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5000).toISOString() },
            { type: 'log', message: 'Fetching candlestick data from API', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4000).toISOString() },
            { type: 'warn', message: 'API response slow: 8500ms', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 3000).toISOString() },
            { type: 'error', message: 'Failed to load chart indicators: timeout after 10000ms', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2000).toISOString() },
            { type: 'log', message: 'Retrying chart load...', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1000).toISOString() }
        ];

        const sampleConsoleLogs2 = [
            { type: 'log', message: '🌙 User preferences loaded', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3000).toISOString() },
            { type: 'info', message: 'Theme: light (default)', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2000).toISOString() },
            { type: 'log', message: 'Dark mode not available in current version', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 1000).toISOString() }
        ];

        const sampleConsoleLogs3 = [
            { type: 'log', message: '📁 Trade history loaded: 1,234 records', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 2000).toISOString() },
            { type: 'warn', message: 'Export feature not implemented', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 1000).toISOString() }
        ];

        const sampleConsoleLogs4 = [
            { type: 'log', message: '🔐 Authentication successful', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 - 10000).toISOString() },
            { type: 'log', message: 'Loading portfolio data...', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 - 9000).toISOString() },
            { type: 'error', message: 'WebSocket connection failed: ECONNREFUSED', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 - 8000).toISOString() },
            { type: 'warn', message: 'Falling back to REST API polling', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 - 7000).toISOString() },
            { type: 'log', message: 'Portfolio loaded: 15 positions', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 - 6000).toISOString() },
            { type: 'error', message: 'Price update failed for TSLA', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 - 5000).toISOString() },
            { type: 'log', message: 'Retrying price fetch...', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 - 4000).toISOString() }
        ];

        // Add example feedback
        const exampleFeedback = [
            {
                id: 'fb1',
                ticketId: 'FB-00001',
                title: 'Chart loading is slow',
                category: 'bug',
                priority: 'high',
                description: 'When I open the charts page, it takes 10+ seconds to load the candlestick chart. This happens consistently.',
                clientId: 'CLT-001001',
                clientEmail: 'john.doe@exante.com',
                clientName: 'John Doe',
                platform: 'web',
                screenshotUrl: null,
                sessionContext: {
                    url: 'https://exante.eu/clientsarea/portfolio/charts',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                    screenResolution: '1920x1080',
                    language: 'en-US',
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                consoleLogs: sampleConsoleLogs1,
                status: 'in_progress',
                submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                comments: []
            },
            {
                id: 'fb2',
                ticketId: 'FB-00002',
                title: 'Add dark mode support',
                category: 'feature',
                priority: 'medium',
                description: 'It would be great to have a dark mode option for the platform, especially for night trading. The bright white background is hard on the eyes during late-night sessions.',
                clientId: 'CLT-001002',
                clientEmail: 'jane.smith@exante.com',
                clientName: 'Jane Smith',
                platform: 'web',
                screenshotUrl: null,
                sessionContext: {
                    url: 'https://exante.eu/clientsarea/portfolio',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
                    screenResolution: '2560x1440',
                    language: 'en-GB',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                },
                consoleLogs: sampleConsoleLogs2,
                status: 'open',
                submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                comments: []
            },
            {
                id: 'fb3',
                ticketId: 'FB-00003',
                title: 'Export trade history to CSV',
                category: 'feature',
                priority: 'medium',
                description: 'I need to export my trade history to CSV for tax reporting purposes. Currently, I can only view it on screen. This would be very helpful for year-end reporting.',
                clientId: 'CLT-001003',
                clientEmail: 'mike.wilson@exante.com',
                clientName: 'Mike Wilson',
                platform: 'web',
                screenshotUrl: null,
                sessionContext: {
                    url: 'https://exante.eu/clientsarea/portfolio/trades',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
                    screenResolution: '1366x768',
                    language: 'en-US',
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                },
                consoleLogs: sampleConsoleLogs3,
                status: 'resolved',
                submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                comments: []
            },
            {
                id: 'fb4',
                ticketId: 'FB-00004',
                title: 'Portfolio values not updating in real-time',
                category: 'bug',
                priority: 'critical',
                description: 'The portfolio page shows stale data. Position values are not updating in real-time even though the market is open. I have to refresh the page manually to see current prices.',
                clientId: 'CLT-001004',
                clientEmail: 'alex.trader@exante.com',
                clientName: 'Alex Trader',
                platform: 'web',
                screenshotUrl: null,
                sessionContext: {
                    url: 'https://exante.eu/clientsarea/portfolio',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
                    screenResolution: '1920x1080',
                    language: 'de-DE',
                    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
                },
                consoleLogs: sampleConsoleLogs4,
                status: 'open',
                submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                comments: []
            },
            {
                id: 'fb5',
                ticketId: 'FB-00005',
                title: 'Improve search functionality',
                category: 'improvement',
                priority: 'low',
                description: 'The instrument search could be improved. It would be helpful to search by ISIN, not just ticker symbol. Also, fuzzy matching would help when I am not sure of the exact spelling.',
                clientId: 'CLT-001005',
                clientEmail: 'sarah.investor@exante.com',
                clientName: 'Sarah Investor',
                platform: 'web',
                screenshotUrl: null,
                sessionContext: {
                    url: 'https://exante.eu/clientsarea/trading',
                    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                    screenResolution: '2048x1536',
                    language: 'fr-FR',
                    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
                },
                consoleLogs: [],
                status: 'open',
                submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                comments: []
            }
        ];

        feedbackItems = exampleFeedback;

        // Classify demo feedback with AI
        feedbackItems.forEach(item => {
            item.aiLabels = classifyFeedback(item);
        });

        saveFeedbackToStorage();
        updateDashboard();
    } else {
        // Migrate existing feedback items that don't have AI labels
        let migrated = 0;
        feedbackItems.forEach(item => {
            if (!item.aiLabels) {
                item.aiLabels = classifyFeedback(item);
                migrated++;
            }
        });

        if (migrated > 0) {
            saveFeedbackToStorage();
            console.log(`🤖 AI Classification: Migrated ${migrated} existing feedback items`);
        }

        updateDashboard();
    }
});

// ===== ANNOTATION EDITOR =====

let annotationCanvas = null;
let annotationCtx = null;
let annotationImage = null;
let annotationTool = 'draw';
let annotationColor = '#ef4444';
let isAnnotating = false;
let annotationStart = { x: 0, y: 0 };
let annotationHistory = [];
let baseImageData = null;

function openAnnotationEditor(imageDataUrl) {
    const editor = document.getElementById('annotationEditor');
    const canvas = document.getElementById('annotationCanvas');

    annotationCanvas = canvas;
    annotationCtx = canvas.getContext('2d');
    annotationHistory = [];

    console.log('📸 Opening annotation editor with image:', imageDataUrl.substring(0, 50) + '...');

    // Load the image
    const img = new Image();
    img.onload = function() {
        console.log('✅ Image loaded:', img.width, 'x', img.height);

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the base image
        annotationCtx.drawImage(img, 0, 0);

        // Save base image data
        baseImageData = annotationCtx.getImageData(0, 0, canvas.width, canvas.height);

        // Show editor
        editor.classList.add('active');

        // Add event listeners
        canvas.addEventListener('mousedown', startAnnotation);
        canvas.addEventListener('mousemove', drawAnnotation);
        canvas.addEventListener('mouseup', endAnnotation);

        console.log('🎨 Annotation editor opened successfully');
    };

    img.onerror = function() {
        console.error('❌ Failed to load image for annotation');
    };

    img.src = imageDataUrl;
    annotationImage = imageDataUrl;
}

function selectAnnotationTool(tool) {
    annotationTool = tool;

    // Update button states
    document.querySelectorAll('.annotation-tool-btn[data-tool]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.annotation-tool-btn[data-tool="${tool}"]`).classList.add('active');

    // Update cursor
    const canvas = document.getElementById('annotationCanvas');
    if (tool === 'text') {
        canvas.style.cursor = 'text';
    } else {
        canvas.style.cursor = 'crosshair';
    }
}

function selectAnnotationColor(color) {
    annotationColor = color;

    // Update color button states
    document.querySelectorAll('.annotation-color').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.annotation-color[data-color="${color}"]`).classList.add('active');
}

function startAnnotation(e) {
    if (annotationTool === 'text') {
        addTextAnnotation(e);
        return;
    }

    isAnnotating = true;
    const rect = annotationCanvas.getBoundingClientRect();

    // Calculate scaled coordinates
    const scaleX = annotationCanvas.width / rect.width;
    const scaleY = annotationCanvas.height / rect.height;

    annotationStart = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };

    // Save current state for undo
    saveAnnotationState();

    if (annotationTool === 'blur') {
        // Blur tool doesn't need stroke style setup
        return;
    }

    annotationCtx.strokeStyle = annotationColor;
    annotationCtx.lineWidth = annotationTool === 'highlight' ? 20 : 3;
    annotationCtx.lineCap = 'round';
    annotationCtx.lineJoin = 'round';

    if (annotationTool === 'highlight') {
        annotationCtx.globalAlpha = 0.3;
    } else {
        annotationCtx.globalAlpha = 1;
    }

    if (annotationTool === 'draw' || annotationTool === 'highlight') {
        annotationCtx.beginPath();
        annotationCtx.moveTo(annotationStart.x, annotationStart.y);
    }
}

function drawAnnotation(e) {
    if (!isAnnotating) return;

    const rect = annotationCanvas.getBoundingClientRect();

    // Calculate scaled coordinates
    const scaleX = annotationCanvas.width / rect.width;
    const scaleY = annotationCanvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    if (annotationTool === 'draw' || annotationTool === 'highlight') {
        annotationCtx.lineTo(currentX, currentY);
        annotationCtx.stroke();
    } else if (annotationTool === 'blur') {
        // Redraw from saved state to show preview
        restoreToLastState();
        applyBlurEffect(annotationStart.x, annotationStart.y, currentX, currentY);
    } else if (annotationTool === 'arrow') {
        // Redraw from saved state to show preview
        restoreToLastState();
        drawArrow(annotationStart.x, annotationStart.y, currentX, currentY);
    }
}

function endAnnotation(e) {
    if (!isAnnotating) return;
    isAnnotating = false;

    const rect = annotationCanvas.getBoundingClientRect();

    // Calculate scaled coordinates
    const scaleX = annotationCanvas.width / rect.width;
    const scaleY = annotationCanvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    if (annotationTool === 'blur') {
        applyBlurEffect(annotationStart.x, annotationStart.y, currentX, currentY);
    } else if (annotationTool === 'arrow') {
        drawArrow(annotationStart.x, annotationStart.y, currentX, currentY);
    }

    annotationCtx.globalAlpha = 1;
}

function applyBlurEffect(x1, y1, x2, y2) {
    // Calculate bounding box for the blur region
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);
    const width = maxX - minX;
    const height = maxY - minY;

    if (width < 1 || height < 1) return;

    // Get image data from the region
    const imageData = annotationCtx.getImageData(minX, minY, width, height);
    const data = imageData.data;

    // Apply pixelation effect (blur by pixelizing)
    const pixelSize = 8; // Controls blur intensity - higher = more blurred
    
    for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
            // Get average color of the pixel block
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            
            for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
                for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
                    const idx = ((y + dy) * width + (x + dx)) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    a += data[idx + 3];
                    count++;
                }
            }
            
            // Calculate average color
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            a = Math.round(a / count);
            
            // Apply average color to entire block
            for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
                for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
                    const idx = ((y + dy) * width + (x + dx)) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = a;
                }
            }
        }
    }

    // Put the blurred image data back
    annotationCtx.putImageData(imageData, minX, minY);
}

function drawArrow(fromX, fromY, toX, toY) {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    annotationCtx.beginPath();
    annotationCtx.moveTo(fromX, fromY);
    annotationCtx.lineTo(toX, toY);
    annotationCtx.stroke();

    // Draw arrowhead
    annotationCtx.beginPath();
    annotationCtx.moveTo(toX, toY);
    annotationCtx.lineTo(
        toX - headLength * Math.cos(angle - Math.PI / 6),
        toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    annotationCtx.moveTo(toX, toY);
    annotationCtx.lineTo(
        toX - headLength * Math.cos(angle + Math.PI / 6),
        toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    annotationCtx.stroke();
}

function addTextAnnotation(e) {
    const rect = annotationCanvas.getBoundingClientRect();

    // Calculate scaled coordinates
    const scaleX = annotationCanvas.width / rect.width;
    const scaleY = annotationCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const text = prompt('Enter text:');
    if (!text) return;

    saveAnnotationState();

    annotationCtx.font = '20px Arial';
    annotationCtx.fillStyle = annotationColor;
    annotationCtx.fillText(text, x, y);
}

function saveAnnotationState() {
    annotationHistory.push(
        annotationCtx.getImageData(0, 0, annotationCanvas.width, annotationCanvas.height)
    );
}

function restoreToLastState() {
    if (annotationHistory.length > 0) {
        const lastState = annotationHistory[annotationHistory.length - 1];
        annotationCtx.putImageData(lastState, 0, 0);
    }
}

function undoAnnotation() {
    if (annotationHistory.length > 0) {
        annotationHistory.pop();

        if (annotationHistory.length > 0) {
            const lastState = annotationHistory[annotationHistory.length - 1];
            annotationCtx.putImageData(lastState, 0, 0);
        } else {
            // Restore base image
            annotationCtx.putImageData(baseImageData, 0, 0);
        }
    }
}

function clearAnnotations() {
    if (confirm('Clear all annotations?')) {
        annotationHistory = [];
        annotationCtx.putImageData(baseImageData, 0, 0);
    }
}

function saveAnnotation() {
    // Get the annotated image
    const imageData = annotationCanvas.toDataURL('image/png');

    if (screenshotFromWidget) {
        // Save to widget screenshot data
        widgetScreenshotData = imageData;

        // Show preview in widget
        document.getElementById('chatScreenshotImage').src = imageData;
        document.getElementById('chatScreenshotPreview').style.display = 'block';
    } else {
        // Save to regular screenshot data
        screenshotData = imageData;

        // Show preview in feedback form
        showScreenshotPreview(imageData);
    }

    // Close annotation editor
    closeAnnotationEditor();

    console.log('✅ Annotations saved');
}

function cancelAnnotation() {
    if (annotationHistory.length > 0) {
        if (!confirm('Discard annotations?')) {
            return;
        }
    }

    closeAnnotationEditor();
}

function closeAnnotationEditor() {
    const editor = document.getElementById('annotationEditor');
    const canvas = document.getElementById('annotationCanvas');

    // Remove event listeners
    canvas.removeEventListener('mousedown', startAnnotation);
    canvas.removeEventListener('mousemove', drawAnnotation);
    canvas.removeEventListener('mouseup', endAnnotation);

    // Hide editor
    editor.classList.remove('active');

    // Show the appropriate modal/widget
    if (screenshotFromWidget) {
        document.getElementById('chatWidgetPopup').style.display = 'block';
        screenshotFromWidget = false;
    } else {
        document.getElementById('feedbackModal').style.display = 'block';
    }

    // Reset annotation state
    annotationHistory = [];
    isAnnotating = false;
}
