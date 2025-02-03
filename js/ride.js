/*global Aidmo _config*/

var Aidmo = window.Aidmo || {};
Aidmo.map = Aidmo.map || {};

(function rideScopeWrapper($) {
    var authToken;
    Aidmo.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
    function requestAmbulance(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your ambulance:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var ambulance;
        var pronoun;
        console.log('Response received from API: ', result);
        ambulance = result.Ambulance;
        displayUpdate(ambulance.Code + ', your ' + ambulance.Service + ' ambulance, is on it\'s way.');
        animateArrival(function animateCallback() {
            displayUpdate(ambulance.Code + ' has arrived. Be prepared');
            Aidmo.map.unsetLocation();
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $(Aidmo.map).on('pickupChange', handlePickupChanged);

        Aidmo.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Ambulance');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        var pickupLocation = Aidmo.map.selectedPoint;
        event.preventDefault();
        requestAmbulance(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = Aidmo.map.selectedPoint;
        var origin = {};

        if (dest.latitude > Aidmo.map.center.latitude) {
            origin.latitude = Aidmo.map.extent.minLat;
        } else {
            origin.latitude = Aidmo.map.extent.maxLat;
        }

        if (dest.longitude > Aidmo.map.center.longitude) {
            origin.longitude = Aidmo.map.extent.minLng;
        } else {
            origin.longitude = Aidmo.map.extent.maxLng;
        }

        Aidmo.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));
