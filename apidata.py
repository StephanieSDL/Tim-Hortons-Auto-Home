import requests

# Define the API endpoint
api_root = "https://pplx.azurewebsites.net/api/rapid/v0"
url_NV = f"{api_root}/numberVerification/verify"
url_SS = f"{api_root}/simswap/check"
url_LV = f"{api_root}/location-verification/verify"


# Set the headers
headers = {
    "Authorization": "Bearer 195812",
    "Cache-Control": "no-cache",
    "accept": "application/json",
    "Content-Type": "application/json"
}

# Set the data (body)
data = {
    "phoneNumber": "13688861127"
}

data_LV = {
    "device": {
        "phoneNumber": "13688861127"
    },
    "area": {
        "type": "Circle",
        "location": {
            "latitude": 49,
            "longitude": -123
        },
        "accuracy": 50
    }
}
