$(document).ready(function () {
    $('#login-form').submit(function (event) {
        event.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        $.ajax({
            url: '/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username: username, password: password }),
            success: function (response) {
                if (response.status === 'success') {
                    window.location.href = '/dashboard';
                } else {
                    $('#login-error').text(response.message);
                }
            },
            error: function () {
                $('#login-error').text('An error occurred during login.');
            }
        });
    });
});
