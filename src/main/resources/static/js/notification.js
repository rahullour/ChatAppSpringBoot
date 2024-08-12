$(document).ready(function() {
    $('.notification').each(function(index) {
        var notificationElement = $(this);
        var timer = 1;

        // Determine the timer duration based on class
        if(notificationElement.hasClass('short-noty')) {
            timer = 2;
        } else if(notificationElement.hasClass('long-noty')) {
            timer = 10;
        }

        var originalMessage = notificationElement.text();
        notificationElement.show();

        // Position the notification
        notificationElement.css('top', (index * 60) + 'px'); // Adjust the spacing between notifications

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
