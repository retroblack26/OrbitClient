#!/bin/bash

# Define the folder path
folder_path="/opt/OrbitClient/resources/"

# Check if the folder exists
if [ -d "$folder_path" ]; then
    # Get the username of the currently logged-in user
    current_user=$(who | awk '{print $1}')

    # Change the owner of the folder to the current user
    chown -R "$current_user:$current_user" "/opt/OrbitClient/resources/"

    echo "Permissions for $folder_path have been modified for user $current_user."
else
    echo "Folder $folder_path does not exist."
fi
