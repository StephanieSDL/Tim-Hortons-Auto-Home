$(document).ready(function () {
    $('#register-form').submit(function (event) {
        event.preventDefault();
        const username = $('#reg-username').val();
        const password = $('#reg-password').val();
        const confirmPassword = $('#reg-confirm-password').val();

        if (password !== confirmPassword) {
            $('#register-error').text('Passwords do not match.');
            return;
        }

        $.ajax({
            url: '/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username: username, password: password }),
            success: function (response) {
                if (response.status === 'success') {
                    alert('Registration successful! You can now log in.');
                    window.location.href = '/login';
                } else {
                    $('#register-error').text(response.message);
                }
            },
            error: function (response) {
                if (response.responseJSON && response.responseJSON.message) {
                    $('#register-error').text(response.responseJSON.message);
                } else {
                    $('#register-error').text('An error occurred during registration.');
                }
            }
        });
    });
});
