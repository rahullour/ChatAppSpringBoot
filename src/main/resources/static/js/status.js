$(document).ready(function() {
    // Existing user invitation code...

    // Handle status selection
    $('#statusSelect').change(function() {
        if ($(this).val() === 'Custom') {
            $('#customStatus').show();
        } else {
            $('#customStatus').hide();
        }
    });

    $('#setStatus').click(function() {
        const status = $('#statusSelect').val() === 'Custom' ? $('#customStatus').val() : $('#statusSelect').val();

        if (status) {
            $.ajax({
                url: '/api/status', // Define your API endpoint for setting status
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ statusMessage: status }),
                success: function(response) {
                    alert('Status updated successfully!');
                },
                error: function(error) {
                    alert('Error updating status.');
                }
            });
        } else {
            alert('Please select a status.');
        }
    });
});
