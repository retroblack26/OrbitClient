const UiUtils = require('../Utils/UiUtils');
class UserOnboarding {
    constructor(steps, options = {}) {
        this.steps = steps;
        this.currentStep = 0;
        this.selectedValue;

        this.nextLabel = options.nextLabel;
        this.prevLabel = options.prevLabel;
        this.skipLabel = options.skipLabel;
        this.doneLabel = options.doneLabel;

        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        document.body.appendChild(this.overlay);

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tooltip';
        this.tooltip.classList.add('onboarding-tooltip-size-medium');
        document.body.appendChild(this.tooltip);

        // Customization options
        this.customAnimation = options.customAnimation || null;
        this.customPositioning = options.customPositioning || null;
        this.interactiveElements = options.interactiveElements || [];
        this.localStorageKey = options.localStorageKey || 'userOnboardingDismissed';
        this.locale = options.locale || 'en';
        this.translations = options.translations || {};
        this.beforeStepCallback = options.beforeStepCallback || null;
        this.onCompleteCallback = options.onCompleteCallback || null;
        this.onDismissCallback = options.onDismissCallback || null;
        this.afterStepCallback = options.afterStepCallback || null;
        this.closeButtonCallback = options.closeButtonCallback || null;
        this.autoAdvance = options.autoAdvance || false;
        this.autoAdvanceDuration = options.autoAdvanceDuration || 5000;
        this.global_title = options.globalTitle || 'Information';

        // Check if the user has dismissed onboarding in the past
        this.dismissed = false;

        this.bindEvents();
    }

    renderStep() {
        if (this.dismissed) {
            this.complete();
            return;
        }

        const step = this.steps[this.currentStep];

        const stepPosition = step.position ? step.position : null;

        if (step.isCentered === true) {
            // Centered step
            this.showCenteredStep(step);
        } else {

            if (step.elements) {
                const targetElements = step.elements.map((element) => document.querySelector(element)).filter(Boolean);

                if (targetElements.length === 0) {
                    console.error(`No valid elements found for step ${this.currentStep}.`);
                    this.nextStep();
                    return;
                }

                // Apply custom animation
                if (this.customAnimation) {
                    this.customAnimation(this.tooltip, () => {
                        this.showTooltip(step, targetElements, stepPosition);
                    });
                } else {
                    this.showTooltip(step, targetElements, stepPosition);
                }
            } else {
                this.showTooltip(step, null, stepPosition);
            }


        }
    }

    showTooltip(step, targetElements, pos) {

        let targetRect, space;

        this.tooltip.style.left = '';
        this.tooltip.style.top = '';

        if (targetElements !== null) {
            targetRect = targetElements[0].getBoundingClientRect();
        }

        this.tooltip.style.transform = '';


        // Execute callback after rendering the step
        if (typeof this.afterStepCallback === 'function' && this.currentStep !== 0) {
            this.afterStepCallback(this.currentStep - 1, this.selectedValue);
        }

        this.tooltip.style.opacity = '0';


        // Clear previous highlights
        if (!step.isSelect) {
            this.clearHighlight();
        }

        // Show the modal overlay
        this.overlay.style.display = 'block';

        // Calculate available space around the target element
        let position = 'bottom'; // Default position
        if (pos == null) {
            space = {
                top: targetRect.top - window.scrollY,
                left: targetRect.left - window.scrollX,
                right: window.innerWidth - (targetRect.left - window.scrollX + targetRect.width),
                bottom: window.innerHeight - (targetRect.top - window.scrollY + targetRect.height),
            };

            // Determine the best position for the tooltip

            if (space.top > space.bottom) {
                position = 'top';
            }

            if (space.left > space.right) {
                position = 'left';
                if (space.top > space.left) {
                    position = 'top';
                }
                if (space.bottom > space.top && space.bottom > space.left) {
                    position = 'bottom';
                }
            } else {
                position = 'right';
                if (space.top > space.right) {
                    position = 'top';
                }
                if (space.bottom > space.top && space.bottom > space.right) {
                    position = 'bottom';
                }
            }
        } else {
            position = pos;
        }


        // Adjust tooltip position based on the chosen position
        switch (position) {
            case 'top':
                this.tooltip.style.left = `${targetRect.left}px`;
                this.tooltip.style.top = `${targetRect.top - this.tooltip.offsetHeight}px`;
                break;
            case 'left':
                this.tooltip.style.left = `300px`;
                break;
            case 'right':
                this.tooltip.style.left = `${targetRect.right}px`;
                this.tooltip.style.top = `${targetRect.top}px`;
                break;
            case 'center':
                this.tooltip.style.left = '50%';
                this.tooltip.style.top = '50%';
                this.tooltip.style.transform = 'translate(-50%, -50%)';
                break;
            default:
                this.tooltip.style.left = `${targetRect.left}px`;
                this.tooltip.style.top = `${targetRect.bottom}px`;
                break;
        }

        if (targetElements) {
            // Highlight multiple elements
            targetElements.forEach((element) => {
                element.classList.add('onboarding-highlight');
            });
        }

        this.tooltip.innerHTML = `
        <div class="onboarding-tooltip-close-button" id="close">
            <div class="button">x</div>
        </div>
  
        <div class="onboarding-tooltip-header">
            <div class="onboarding-tooltip-header-img">
              <img src="themes/question_icon.png" width="15">
            </div>
            <div class="onboarding-tooltip-header-title">${this.global_title}</div>
        </div>
  
        <div class="onboarding-tooltip-content">
          <div class="container">
            <div class="caracterImage">
              <div class="img-icon ${step.caracter}"></div>
            </div>
            <div class="left-arrow"></div>
            <div class="caracterContent">
            <p>${step.title}</p>
              <div class="content">
                  <p>${step.intro}</p>
                  ${typeof step.selectOptions !== 'undefined' ? ' <section class="custom-select" style="left: 50%;top: 35px;transform: translate(-50%, -50%);"><select name="' + step.selectName + '" id="tutorialSelect"></select></section>' : ''}
              </div>
            </div>

            ${this.currentStep > 0 ? ' <section class="btn-wrapper previous"><button class="btn" id="prev-button">' + this.prevLabel + '</button></section>' : ''}
            <section class="btn-wrapper skip"><button class="btn" id="skip-button">${this.skipLabel}</button></section>
            ${this.currentStep < this.steps.length - 1 ? '<section class="btn-wrapper next"><button id="next-button" class="btn">' + this.nextLabel + '</button></section>' : '<section class="btn-wrapper next"><button id="done-button" class="btn">' + this.doneLabel + '</button></section>'}
            </div>
        </div>
        `;

        // Attach event listeners to the buttons
        const prevButton = this.tooltip.querySelector('#prev-button');
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.prevStep();
            });
        }

        const nextButton = this.tooltip.querySelector('#next-button');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (typeof step.selectOptions !== 'undefined') {
                    this.selectedValue = document.getElementById('tutorialSelect').value;
                }
                this.nextStep();
            });
        }

        const skipButton = this.tooltip.querySelector('#skip-button');
        if (skipButton) {
            skipButton.addEventListener('click', () => {
                this.dismiss();
            });
        }

        const doneButton = this.tooltip.querySelector('#done-button');
        if (doneButton) {
            doneButton.addEventListener('click', () => {
                this.complete();
            });
        }

        const closeButton = this.tooltip.querySelector('#close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (typeof this.closeButtonCallback === 'function') {
                    this.closeButtonCallback(this.currentStep);
                }
            });
        }

        if (typeof step.selectOptions !== 'undefined') {
            let parentSelect = document.getElementById('tutorialSelect');
            parentSelect.parentElement.parentElement.parentElement.style.height = '190px';
            step.selectOptions.forEach((option) => {
                let optionElement = document.createElement('option');
                optionElement.setAttribute('value', option.value);
                optionElement.innerText = option.label;
                parentSelect.appendChild(optionElement);
            });
            if (step.selectedValue) {
                parentSelect.value = step.selectedValue;
            }
            UiUtils.initializeSelects(parentSelect.parentElement);
        }

        // Auto-advance to the next step
        if (this.autoAdvance) {
            setTimeout(() => {
                this.nextStep();
            }, this.autoAdvanceDuration);
        }

        // Display the tooltip
        this.tooltip.style.opacity = '1';

        // Execute callback before rendering the step
        if (typeof this.beforeStepCallback === 'function') {
            this.beforeStepCallback(this.currentStep);
        }
    }


    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                this.nextStep();
            } else if (e.key === 'ArrowLeft') {
                this.prevStep();
            }
        });
    }

    // ...
    prevStep() {
        if (this.currentStep > 0) {
            this.clearHighlight();
            this.currentStep--;
            this.renderStep();
        } else {
            // If the current step is 0, don't go to a negative step
            this.currentStep = 0;
        }
    }

    nextStep() {
        if (this.currentStep <= this.steps.length - 1) {
            this.clearHighlight();
            this.currentStep++;
            this.renderStep();
        } else {
            this.dismiss();
        }
    }
    // ...


    clearHighlight() {
        this.steps.forEach((step) => {
            if (step.elements) {
                step.elements.forEach((element) => {
                    const targetElement = document.querySelector(element);
                    if (targetElement) {
                        targetElement.classList.remove('onboarding-highlight');
                    }
                });
            }
        });
    }

    dismiss() {
        this.dismissed = true;
        if (typeof this.onDismissCallback === 'function') {
            this.onDismissCallback(this.currentStep);
        }
        this.complete();
    }

    complete() {
        // Hide and remove the modal overlay
        this.overlay.style.display = 'none';
        this.tooltip.style.display = 'none';

        this.clearHighlight();

        if (this.dismissed == false) {
            if (typeof this.afterStepCallback === 'function') {
                this.afterStepCallback(this.currentStep);
            }
        }

        if (typeof this.onCompleteCallback === 'function') {
            this.onCompleteCallback(this.dismissed);
        }
    }

    getTranslatedMessage(message) {
        const translations = this.translations[this.locale] || {};
        return translations[message] || message;
    }

    reloadSteps(steps) {
        this.steps = steps;
    }

    start(step) {
        if (step) {
            this.currentStep = step;
        }
        this.renderStep();
    }
}

module.exports = UserOnboarding;
