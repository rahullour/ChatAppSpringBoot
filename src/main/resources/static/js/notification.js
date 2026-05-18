// Function to activate and fade out a single notification based on your existing timer logic
function initializeNotification(notificationElement) {
    // Calculate index based on how many elements are visible
    var index = $('#notification-container .notification:visible').length;
    var timer = 1;

    if (notificationElement.hasClass('short-noty')) {
        timer = 2;
    } else if (notificationElement.hasClass('long-noty')) {
        timer = 6;
    } else if (notificationElement.hasClass('medium-noty')) {
        timer = 4;
    }

    notificationElement.show();

    // FIX: Add a base offset (20px) so the first notification doesn't touch the absolute top of the screen

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

    const formData = new FormData(inviteForm);

    const emailSelect = document.getElementById("emailInput");
    if (emailSelect) {
        const selectedValues = Array.from(emailSelect.selectedOptions).map(opt => opt.value);
        if (selectedValues.length > 0) {
            formData.set("emails", selectedValues.join(","));
        } else {
            const hiddenEmailList = document.getElementById("emailList");
            if (hiddenEmailList && hiddenEmailList.value) {
                formData.set("emails", hiddenEmailList.value);
            }
        }
    }

    if (!formData.get("emails") || formData.get("emails").trim() === "") {
        alert("Please select or type at least one recipient email address first.");
        return;
    }

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
            // SUCCESS: Trigger modal closure
            const modalElement = document.getElementById('inviteModal');
            if (modalElement) {
                const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modalInstance.hide();
                // NOTE: The hidden.bs.modal event listener above will now
                // automatically handle inviteForm.reset(), Select2 flushing, and image hiding!
            }

            if (data) {
                injectDynamicNotification(data.message, data.type, data.durationType, "success");
            }

        } else {
            // FAILURE: (e.g. status 400) Keep the modal open, but show the error alert banner
            if (data && data.message) {
                injectDynamicNotification(data.message, data.type, data.durationType, "danger");
            } else {
                const errorText = await response.text();
                alert("Failed to send invites: " + errorText);
            }
        }
    } catch (error) {
        console.error("AJAX error transmission failure:", error);
    }
};

// Dynamic local notification factory
function injectDynamicNotification(message, typeClass, durationClass, baseAlertStyle) {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const newNotification = document.createElement("div");
    newNotification.className = `alert ${baseAlertStyle} notification ${typeClass} ${durationClass}`;
    newNotification.textContent = message;
    newNotification.style.display = "none";

    container.appendChild(newNotification);
    initializeNotification($(newNotification));
}