$(document).ready(function() {
    $('#notification-container .notification').each(function(index) {
        var notificationElement = $(this);
        var timer = 1;

        if (notificationElement.hasClass('short-noty')) {
            timer = 1;
        } else if (notificationElement.hasClass('long-noty')) {
            timer = 10;
        } else if (notificationElement.hasClass('medium-noty')) {
            timer = 5;
        }

        notificationElement.show();
        notificationElement.css('top', (index * 60) + 'px');

        var interval = setInterval(function() {
            timer--;
            if (timer === 0) {
                clearInterval(interval);
                notificationElement.fadeOut(500, function() {
                    $(this).remove();
                });
            }
        }, 1000);
    });
});
