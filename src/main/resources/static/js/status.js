$(document).ready(function() {
    // Handle status selection
    $('#statusSelect').change(function() {
        if ($(this).val() === 'Custom') {
            $('#customStatus').show();
        } else {
            $('#customStatus').hide();
        }
    });
});
document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        fetchStatus('api/myStatus'),
    ])
    .then(([userStatus]) => {
        document.getElementById("myStatus").innerHTML = userStatus.statusValue;
    })
    .catch(error => {
        console.error('Error fetching myStatus:');
    });
});

function fetchStatus(endpoint) {
    return fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(err => {
            console.error('Error fetching status:');
            throw err;
        });
}


