class UiUtils {

    static instance;
    constructor() {
        if (UiUtils.instance) {
            return UiUtils.instance;
        }

        UiUtils.instance = this;
    }

    disableSelectElement(element, disable) {
        let disabledElement = element;
        let ElementToDisable = disabledElement.parentElement.parentElement.getElementsByClassName('select-items')[0].querySelector('section[value="' + disabledElement.value + '"]');

        if (disable) {
            ElementToDisable.classList.add('disabled');
        } else {
            ElementToDisable.classList.remove('disabled');
        }

    }


    blinkElement(element, blinkNumber, blinkTime) {
        let currentBlink = 0;

        // Add a class for blinking
        element.classList.add('blinking');

        // Function to toggle brightness
        const toggleBrightness = () => {
            if (currentBlink < blinkNumber * 2) {
                element.classList.toggle('blink-bright');
            } else {
                // Remove the blinking class when done
                element.classList.remove('blinking');
                element.classList.remove('blink-bright');
                clearInterval(blinkInterval);
            }
            currentBlink++;
        };

        // Start blinking
        const blinkInterval = setInterval(toggleBrightness, blinkTime / 2);
    }

    async initializeSelects(input) {
        var x, i, j, l, ll, selElmnt, a, b, c;
        /*look for any elements with the class "custom-select":*/

        if (input) {
            x = [];
            x[0] = input;
        } else {
            x = document.getElementsByClassName("custom-select");
        }

        l = x.length;
        for (i = 0; i < l; i++) {
            selElmnt = x[i].getElementsByTagName("select")[0];
            let existingSections = x[i].getElementsByTagName("section");

            if (existingSections.length > 0) {
                a = existingSections[0];
                b = existingSections[1];

                a.setAttribute('value', selElmnt.value);

                let text = selElmnt.querySelector('option[value="' + selElmnt.value + '"]').innerHTML;

                if (selElmnt.name == 'country') {
                    a.innerHTML = '<span class="fi fi-' + selElmnt.value.substring(3, selElmnt.value.length).toLowerCase() + '"></span> ' + text;
                } else {
                    a.innerHTML = text;
                }

                /*   for (j = 0; j < selElmnt.length; j++) {
                      if (selElmnt.options[j].value == selElmnt.value) {
                          if (selElmnt.name == 'country') {
                              a.innerHTML = '<span class="fi fi-' + selElmnt.options[j].value.substring(3, selElmnt.options[j].value.length).toLowerCase() + '"></span> ' + selElmnt.options[j].innerHTML;
                          } else {
                              a.innerHTML = selElmnt.options[j].innerHTML;
                          }
                          break;
                      }
                  } */

            } else {
                ll = selElmnt.length;
                a = document.createElement("section");
                a.setAttribute("class", "select-selected");
                b = document.createElement("section");
                b.setAttribute("class", "select-items select-hide");

                if (selElmnt.name == 'country') {
                    a.setAttribute('value', selElmnt.value);
                }

                for (j = 0; j < ll; j++) {

                    if (selElmnt.options[j].value == selElmnt.value) {
                        if (selElmnt.name == 'country') {
                            a.innerHTML = '<span class="fi fi-' + selElmnt.options[j].value.substring(3, selElmnt.options[j].value.length).toLowerCase() + '"></span> ' + selElmnt.options[j].innerHTML;
                        } else {
                            a.innerHTML = selElmnt.options[j].innerHTML;
                        }
                    }
                    /*for each option in the original select element,
                    create a new DIV that will act as an option item:*/
                    c = document.createElement("section");


                    if (selElmnt.name == 'country') {
                        c.innerHTML = '<span class="fi fi-' + selElmnt.options[j].value.substring(3, selElmnt.options[j].value.length).toLowerCase() + '"></span> ' + selElmnt.options[j].innerHTML;
                    } else {
                        c.innerHTML = selElmnt.options[j].innerHTML;
                    }
                    c.setAttribute('value', selElmnt.options[j].value);

                    c.addEventListener("click", handleSelectClick);
                    b.appendChild(c);
                }

                x[i].appendChild(a);
                x[i].appendChild(b);
                a.addEventListener("click", closeOnClick);
            }

        }

        function closeAllSelect(elmnt) {
            /*a function that will close all select boxes in the document,
            except the current select box:*/
            var x, y, i, xl, yl, arrNo = [];
            x = document.getElementsByClassName("select-items");
            y = document.getElementsByClassName("select-selected");
            xl = x.length;
            yl = y.length;
            for (i = 0; i < yl; i++) {
                if (elmnt == y[i]) {
                    arrNo.push(i)
                } else {
                    y[i].classList.remove("select-arrow-active");
                }
            }
            for (i = 0; i < xl; i++) {
                if (arrNo.indexOf(i)) {
                    x[i].classList.add("select-hide");
                }
            }
        }

        function closeOnClick(e) {
            e.stopPropagation();
            closeAllSelect(e.target);
            e.target.nextSibling.classList.toggle("select-hide");
            e.target.classList.toggle("select-arrow-active");
        }

        function handleSelectClick(e) {
            if (!e.target.classList.contains('disabled')) {
                const event = new Event('change', {
                    'bubbles': true,
                    'cancelable': true
                });
                /*when an item is clicked, update the original select box,
                and the selected item:*/
                var y, i, k, s, h, sl, yl;
                s = e.target.parentNode.parentNode.getElementsByTagName("select")[0];
                sl = s.length;
                h = e.target.parentNode.previousSibling;
                for (i = 0; i < sl; i++) {
                    if (s.options[i].getAttribute('value') == e.target.getAttribute('value')) {
                        s.selectedIndex = i;
                        h.innerHTML = e.target.innerHTML;
                        h.setAttribute('value', e.target.getAttribute('value'))
                        y = e.target.parentNode.getElementsByClassName("same-as-selected");
                        yl = y.length;
                        for (k = 0; k < yl; k++) {
                            y[k].removeAttribute("class");
                        }
                        e.target.setAttribute("class", "same-as-selected");
                        break;
                    }
                }
                h.click();
                s.dispatchEvent(event);
            }
        }
        /*if the user clicks anywhere outside the select box,
        then close all select boxes:*/
        document.addEventListener("click", closeAllSelect);
    }
    
    makeElementDraggable(element,  callback, secondContainer) {
        element.draggable = true;
    
        element.addEventListener("dragstart", async (e) => {
            this.draggedElement = element;
            let cancel = false;
            if (callback) {
                await callback({ type: "dragstart", element, cancelAnimation: () => cancel = true });
            }
    
            if (!cancel) {
                element.classList.add("dragging");
            }
    
            // Set the drag image to a transparent 1x1 pixel image
            const transparentImage = new Image();
            transparentImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(transparentImage, 0, 0);
        });
    
        element.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
    
        element.addEventListener("dragenter", (e) => {
            if (this.draggedElement !== null && this.draggedElement !== element) {
                const tabs = Array.from(element.parentElement.children);
                const draggedTabIndex = tabs.indexOf(this.draggedElement);
                const targetTabIndex = tabs.indexOf(element);
                if (draggedTabIndex !== -1 && targetTabIndex !== -1) {
                    if (draggedTabIndex < targetTabIndex) {
                        element.parentElement.insertBefore(this.draggedElement, element.nextSibling);
                    } else {
                        element.parentElement.insertBefore(this.draggedElement, element);
                    }
                    if (callback) {
                        callback({ type: "dragenter", draggedTabIndex, targetTabIndex, element, tabs });
                    }
                }
            }
        });
    
        // Handle the dragenter event for the second container, if provided
        if (secondContainer) {
            secondContainer.addEventListener("dragover", (e) => {
                e.preventDefault();
            });
    
            secondContainer.addEventListener("dragenter", async (e) => {
                if (this.draggedElement !== null && this.draggedElement !== element) {
                    let cancel = false;

                        const tabs = Array.from(secondContainer.children);
                        const draggedTabIndex = tabs.indexOf(this.draggedElement);
                        const targetTabIndex = tabs.indexOf(element);
                        if (draggedTabIndex !== -1 && targetTabIndex !== -1) {
                            if (draggedTabIndex < targetTabIndex) {
                                secondContainer.insertBefore(this.draggedElement, element.nextSibling);
                            } else {
                                secondContainer.insertBefore(this.draggedElement, element);
                            }
                          
                        }
                    if (callback) {
                        await callback({ type: "dragenter-secondary", element: this.draggedElement, targetContainer: secondContainer, cancelBehavior: () => (cancel = true) });
                    }
                    if(!cancel){
                        secondContainer.appendChild(this.draggedElement);
                    }
                }
            });
        }
    
        element.addEventListener("dragend", (e) => {
            this.draggedElement.classList.remove("dragging");
            this.draggedElement = null;
    
            if (callback) {
                callback({ type: "dragend-secondary", element });
            }
        });
    }
    

    checkElementsFitContainer(parent, children) {
        let currentWidth = 0;
        let topContainerWidth = parent.offsetWidth;
        let doesFit = true;

        if (children.length > 0) {
            for (let child of children) {
                // Use window.getComputedStyle to get the style of the element
                const childStyle = window.getComputedStyle(child);
                currentWidth += parseInt(childStyle.minWidth, 10); // Add the element's width, including margins
            }

            const firstChildStyle = window.getComputedStyle(children[0]);
            if ((currentWidth + parseInt(firstChildStyle.minWidth, 10)) >= topContainerWidth) {
                doesFit = false;
            }
        }

        return doesFit;
    };

    dragElement(elmnt) {
        var pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        if (elmnt !== null) {
            if (elmnt.querySelector(".modal-header")) {
                /* if present, the header is where you move the DIV from:*/
                elmnt.querySelector(".modal-header").onmousedown = dragMouseDown;
            } else {
                /* otherwise, move the DIV from anywhere inside the DIV:*/
                elmnt.onmousedown = dragMouseDown;
            }
        }


        function dragMouseDown(e) {
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

}

module.exports = new UiUtils();