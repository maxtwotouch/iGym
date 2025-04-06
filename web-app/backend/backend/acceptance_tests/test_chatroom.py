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
from backend.models import UserProfile, Workout, Exercise
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class ChatRoomTest(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        frontend_dir = settings.BASE_DIR.parent / "frontend"
        env_path = frontend_dir / ".env"
        
        ws_url = f"ws://{cls.live_server_url.split('://')[1]}/ws/chat/"

        # Set environment variable in frontend
        with open(env_path, "w") as f:
            f.write(f"VITE_BACKEND_URL={cls.live_server_url}\n")
            f.write(f"VITE_WS_URL={ws_url}\n")
        

        # Start frontend
        cls.frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(frontend_dir),
            env={
                **os.environ,
                "VITE_BACKEND_URL": cls.live_server_url,
                "VITE_WS_URL": ws_url,
                "VITE_ACCESS_TOKEN": "", 
                "VITE_REFRESH_TOKEN": "",  
                "VITE_USERNAME": "",       
                "VITE_USER_TYPE": "",     
            },
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        
        # Give some time for the frontend to start
        time.sleep(10)

        # Set up WebDriver (Firefox)
        options = Options()
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
        
        # Problems with using web server with test backend
        print("sucessfully created a chat room")
        
        
        
        
        
        

        
        
        
        
        
        
        
        
        