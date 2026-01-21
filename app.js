// ==========================================
// Feedback Widget System - Demo App
// ==========================================

// Store feedback items (simulating backend storage)
let feedbackItems = [];

// Store console logs for feedback
let consoleLogs = [];
const maxConsoleLogs = 100;

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

        feedbackItems.push(feedbackItem);
        saveFeedbackToStorage();
        updateDashboard();

        console.log('📝 Feedback submitted:', feedbackItem.ticketId);

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

        // Add to storage
        feedbackItems.push(feedbackItem);
        saveFeedbackToStorage();

        // Update dashboard
        updateDashboard();

        console.log('✅ Feedback saved:', feedbackItem.ticketId);

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
        saveFeedbackToStorage();
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
