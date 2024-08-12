$(document).ready(function() {
    $('#notification-container .notification').each(function(index) {
        var notificationElement = $(this);
        var timer = 1;
        if(notificationElement.hasClass('short-noty')) {
            timer = 1;
        } else if(notificationElement.hasClass('long-noty')) {
            timer = 10;
        } else if(notificationElement.hasClass('medium-noty')) {
            timer = 5;
        }

        var originalMessage = notificationElement.text();
        notificationElement.show();

        notificationElement.css('top', (index * 60) + 'px');

        var interval = setInterval(function() {
            timer--;
            if (timer === 0) {
                clearInterval(interval);
                notificationElement.css('opacity', '0');
                setTimeout(function() {
                    notificationElement.remove();   
                }, 500);
            } else {
                notificationElement.text(originalMessage + " " + timer + " seconds...");
            }
        }, 1000);
    });
});
