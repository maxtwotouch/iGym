from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import subprocess
import os
import time
from django.core.management import call_command
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from backend.models import UserProfile, Workout, Exercise
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class ChatRoomTest(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        frontend_dir = settings.BASE_DIR.parent / "frontend"

        # Start frontend based on OS
        if (os.name == "posix"):
            npm_command = "npm"
        elif (os.name == "nt"):
            npm_command = r"C:\Program Files\nodejs\npm.cmd"

        env_path = frontend_dir / ".env"

        # Set environment variable in asgi server
        env={
            **os.environ,
            "DJANGO_SETTINGS_MODULE": "backend.settings", # Tells Django wher to find the settings module
            "PYTHONPATH": str(settings.BASE_DIR.parent), # Tells Python where to find the Django project
        }

        # Start the asgi server manually (used for web socket in chatroom), since Django's default test server only supports wsgi
        # Issue: Please note that this means that when a user sends a message in this test, it will be stored in the actual database
        # and not the test database created by Django's test framework. 
        cls.backend_process = subprocess.Popen(
            ["daphne", "-b", "localhost", "-p", "8001", "backend.asgi:application"], # Starting asgi server on localhost:8001
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )
        ws_url = "ws://localhost:8001/ws/chat/"

        # Start frontend
        cls.frontend_process = subprocess.Popen(
            [npm_command, "run", "dev"],
            cwd=str(frontend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        # Set environment variable in frontend
        with open(env_path, "w") as f:
            f.write(f"VITE_BACKEND_URL={cls.live_server_url}\n")
            f.write(f"VITE_WS_URL={ws_url}\n")

        # Give some time for the frontend to start
        time.sleep(10)

        # Set up WebDriver (Firefox)
        options = Options()
        if os.name == "nt":
            options.binary_location = r"C:\Program Files\Mozilla Firefox\firefox.exe"
        options.headless = False
        
        cls.browser = webdriver.Firefox(options=options)
    
    @classmethod
    def tearDownClass(cls):
        # Reset the environment variable in the frontend
        frontend_dir = settings.BASE_DIR.parent / "frontend"
        env_path = frontend_dir / ".env"
        
        with open(env_path, "w") as f:
            f.write("")

        cls.browser.quit()
        cls.frontend_process.terminate()
        cls.backend_process.terminate()
        super().tearDownClass()
    
    def test_chatroom(self):
        call_command("loaddata", "exercises.json")
        
        # Create two users who is going to communicate with each other
        self.test_user = User.objects.create_user(username="testUser", password="password")
        self.test_profile = UserProfile.objects.create(user=self.test_user)
        
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.second_test_profile = UserProfile.objects.create(user=self.second_user)
        
        exercises = Exercise.objects.all()
        # Create a test workout
        self.test_workout = Workout.objects.create(author=self.test_user, name="Test Workout")
        self.test_workout.exercises.set(exercises[:2])
        self.test_workout.owners.add(self.test_user)
        
        # Generate and store JWT tokens
        refresh = RefreshToken.for_user(self.test_user)
        self.access_token = str(refresh.access_token)
        self.refresh_token = str(refresh)
        
        # Set environment variables for the frontend process
        os.environ["VITE_ACCESS_TOKEN"] = self.access_token
        os.environ["VITE_REFRESH_TOKEN"] = self.refresh_token
        os.environ["VITE_USERNAME"] = self.test_user.username
        os.environ["VITE_USER_TYPE"] = str(self.test_profile.role) 
        
        self.browser.refresh()
        self.browser.get("http://localhost:5173")
        
        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        self.browser.find_element(By.NAME, "username").send_keys("testUser")
        self.browser.find_element(By.NAME, "password").send_keys("password")
        
        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        time.sleep(5)
        
        chat_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-name="Chat Page"]'))
        )
        
        chat_button.click()
        time.sleep(5)
        
        # Name for the chat room
        workout_name_field = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "chatRoomName"))
        )
        workout_name_field.send_keys("Test chat")
    
        print(self.browser.page_source)
        
        # Locate the dropdown menu
        dropdown = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[aria-haspopup="true"]'))
        )
        dropdown.click()
        
        time.sleep(5)
        
        # Wait for the options and select a user to create a chat room with
        option_text = "secondTestUser"  
        option = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.XPATH, f"//div[contains(@class, 'css-') and text()='{option_text}']"))
        )
        option.click()
        time.sleep(5)
        
        create_chat_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "createChatRoom"))
        )
        
        create_chat_button.click()
        time.sleep(5)
        
        # Locate the button to join the 
        join_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//span[text()="Test chat"]/following-sibling::button[contains(text(), "Join")]'))
        )
        
        join_button.click()
        time.sleep(5)
        
        message_input = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "messageField"))
        )
        message_input.click()
        message_input.send_keys("Hello world!")
        time.sleep(5)

        send_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "sendMessage"))
        )
        send_button.click()
        time.sleep(5)
        
        # Hover over the profile image so that the logout button appears
        profile_image = WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "cursor-pointer"))
        )
        ActionChains(self.browser).move_to_element(profile_image).perform() # Hover over the profile image
        time.sleep(5)

        logout_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "logoutButton"))
        )
        logout_button.click()
        print("User logged out successfully!")
        time.sleep(5)

        # Fill in login credentials for the second user
        self.browser.find_element(By.NAME, "username").send_keys("secondTestUser")
        self.browser.find_element(By.NAME, "password").send_keys("password")

        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        time.sleep(5)

        chat_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-name="Chat Page"]'))
        )
        chat_button.click()
        time.sleep(5)

        join_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//span[text()="Test chat"]/following-sibling::button[contains(text(), "Join")]'))
        )
        join_button.click()
        time.sleep(5)

        # Important: The issue is that the asgi server started as a subprocess does not have access to the same test database
        # created by Django's test framework. This means that any database writes that happen via web socket connections inside
        # the asgi process (such as storing chat messages) will be written to the main database and not the test database.
        # Thus the data written by the asgi server is not visible to the wsgi test process.

        print("sucessfully created a chat room and sent a message")
        
        
        
        
        
        

        
        
        
        
        
        
        
        
        