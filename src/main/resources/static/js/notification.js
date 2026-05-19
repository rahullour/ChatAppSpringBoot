function initializeNotification(notificationElement) {
    // Calculate index based on how many elements are visible
    var index = $('#notification-container .notification:visible').length;
    var timer = 1;

    if (notificationElement.hasClass('short-noty')) {
        timer = 2;
    } else if (notificationElement.hasClass('long-noty')) {
        timer = 8;
    } else if (notificationElement.hasClass('medium-noty')) {
        timer = 4;
    }
    // FIX: Position the element vertically *before* showing it so they don't overlap
    notificationElement.css({ top: (10 + (index * 65)) + 'px' });
    notificationElement.show();

    var interval = setInterval(function() {
        timer--;
        if (timer === 0) {
            clearInterval(interval);
            notificationElement.fadeOut(500, function() {
                $(this).remove();

                // Shift remaining notifications up smoothly when one vanishes
                $('#notification-container .notification:visible').each(function(i) {
                    $(this).animate({ top: (20 + (i * 65)) + 'px' }, 200);
                });
            });
        }
    }, 1000);
}

// Global initialization logic on page load
$(document).ready(function() {
    // 1. Initialize any notifications rendered by Thymeleaf on page load
    $('#notification-container .notification').each(function() {
        initializeNotification($(this));
    });

    // 2. TOGGLE GROUP CHAT FIELDS (Keeps inputs properly synced with the switch)
    $('#group_type').on('change', function() {
        const isGroupChat = $(this).is(':checked');
        const $groupNameInput = $('#group_name');
        const $fileInput = $('#profilePictureFile');

        if (isGroupChat) {
            $groupNameInput.removeAttr('disabled').removeClass('disabled');
            $fileInput.removeAttr('disabled');
        } else {
            $groupNameInput.attr('disabled', 'disabled').addClass('disabled').val('');
            $fileInput.attr('disabled', 'disabled').val('');
            $('#imagePreview').hide();
        }
    });

    // =========================================================================
    // FIX: BULLETPROOF MODAL RESET ON CLOSE (SELECT2 FLUSH & IMAGE RESET)
    // =========================================================================
    const modalElement = document.getElementById('inviteModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', function () {
            console.log("Modal hidden event triggered: Flushing all form cache and plugin UI states.");

            const inviteForm = document.getElementById("inviteForm");
            if (inviteForm) {
                // Completely clear all native textual, checkbox, and file parameters
                inviteForm.reset();
            }

            // The Select2 Rescue: Force Select2 to clear out its visual tags
            if ($.fn.select2) {
                $('#emailInput').val(null).trigger('change');
            }

            // THE IMAGE PREVIEW FIX: Reset the thumbnail image back to default layout placeholder
            const previewImage = document.getElementById("previewImage");
            if (previewImage) {
                previewImage.setAttribute("src", "/images/profile-image.png");
            }

            // Explicitly force the image preview wrapper block to hide out of sight
            const imagePreview = document.getElementById("imagePreview");
            if (imagePreview) {
                imagePreview.style.display = "none";
            }

            // Force the group-dependent fields to lock down cleanly again
            const $groupNameInput = $('#group_name');
            const $fileInput = $('#profilePictureFile');
            $groupNameInput.attr('disabled', 'disabled').addClass('disabled');
            $fileInput.attr('disabled', 'disabled');
        });
    }
});

// Asynchronous invite dispatcher
window.sendInviteAjax = async function (event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const inviteForm = document.getElementById("inviteForm");
    if (!inviteForm) return;

    // 1. MANUALLY TRIGGER HTML5 VALIDATION WITHOUT SUBMITTING
    if (!inviteForm.checkValidity()) {
        inviteForm.classList.add('was-validated');
        inviteForm.reportValidity();
        return; // Stop right here if validation fails!
    }

    // 2. EXTRACT REQUIRED DATA FROM FORM
    // Create a fresh FormData object to explicitly control parameter names
    const formData = new FormData();

    // A. Extract Sender Email
    const senderEmailInput = inviteForm.querySelector('input[name="senderEmail"]');
    formData.append("senderEmail", senderEmailInput ? senderEmailInput.value : "");

    // B. Extract Emails
    const emailSelect = document.getElementById("emailInput");
    let emailString = "";
    if (emailSelect) {
        const selectedValues = Array.from(emailSelect.selectedOptions).map(opt => opt.value);
        if (selectedValues.length > 0) {
            emailString = selectedValues.join(",");
        } else {
            const hiddenEmailList = document.getElementById("emailList");
            if (hiddenEmailList && hiddenEmailList.value) {
                emailString = hiddenEmailList.value;
            }
        }
    }
    formData.append("emails", emailString);

    // C. Extract Switch Status (Forces true/false mapping for the Spring boolean backend)
    const groupTypeCheckbox = document.getElementById("group_type");
    const isGroupChat = groupTypeCheckbox ? groupTypeCheckbox.checked : false;
    formData.append("type", isGroupChat ? "true" : "false");

    // D. Extract Group Name & Profile Picture (Only appended if it's actually a Group Chat)
    if (isGroupChat) {
        const groupNameInput = document.getElementById("group_name");
        formData.append("groupName", groupNameInput ? groupNameInput.value.trim() : "");

        const fileInput = document.getElementById("profilePictureFile");
        if (fileInput && fileInput.files.length > 0) {
            formData.append("profilePicture", fileInput.files[0]);
        }
    } else {
        // Explicitly set empty values for direct user invites so the backend handles them cleanly
        formData.append("groupName", "");
    }

    // 3. CLOSE MODAL IMMEDIATELY
    // Data is safely stored in the formData object; close the UI now
    const modalElement = document.getElementById('inviteModal');
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modalInstance.hide();
    }

    // 4. ASYNCHRONOUS BACKGROUND TRANSMISSION
    const csrfTokenElement = document.querySelector('input[name="_csrf"]');
    const headers = {};
    if (csrfTokenElement) {
        headers['X-CSRF-TOKEN'] = csrfTokenElement.value;
    }

    try {
        const targetUrl = inviteForm.getAttribute("action") || "/api/invites";
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const contentType = response.headers.get("content-type");
        let data = null;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        }

        if (response.ok) {
            if (data) {
                injectDynamicNotification(data.message, data.type, data.durationType);
            }
        } else {
            if (data && data.message) {
                injectDynamicNotification(data.message, data.type, data.durationType);
            } else {
                const errorText = await response.text();
                console.error("Server error response:", errorText);
            }
        }
    } catch (error) {
        console.error("AJAX error transmission failure:", error);
    }
};

// Dynamic local notification factory
function injectDynamicNotification(message, type, duration) {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const newNotification = document.createElement("div");
    newNotification.className = `${type} notification ${duration}`;
    newNotification.textContent = message;
    newNotification.style.display = "none";

    container.appendChild(newNotification);
    initializeNotification($(newNotification));
}