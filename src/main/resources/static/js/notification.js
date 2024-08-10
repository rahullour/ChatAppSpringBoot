$(document).ready(function() {
    $('.notification').each(function() {
        var notificationElement = $(this);
        var timer = notificationElement.hasClass('short-notification') ? 1 : 10;
        var originalMessage = notificationElement.text();

        notificationElement.show();

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

        notificationElement.on('click', function() {
            $(this).fadeOut(500, function() {
                $(this).remove();
            });
        });
    });
});
