import requests

# Define the API endpoint
url = "https://pplx.azurewebsites.net/api/rapid/v0/numberVerification/verify"

# Set the headers
headers = {
    "Authorization": "Bearer {195812}",
    "Cache-Control": "no-cache",
    "accept": "application/json",
    "Content-Type": "application/json"
}

# Set the data (body)
data = {
    "phoneNumber": "13688861127"
}

# Make the POST request
response = requests.post(url, headers=headers, json=data)

# Print the response
# print("Status Code:", response.status_code)
# print("Response Body:", response.json())
