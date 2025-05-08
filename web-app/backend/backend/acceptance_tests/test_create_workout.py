from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import subprocess
import os
import time
from django.core.management import call_command
from backend.models import UserProfile
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import unittest

class CreateWorkoutTest(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        frontend_dir = settings.BASE_DIR.parent / "frontend"
        env_path = frontend_dir / ".env"

        # Set environment variable in frontend
        with open(env_path, "w") as f:
            f.write(f"VITE_BACKEND_URL={cls.live_server_url}\n")
        
        # Start frontend
        cls.frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(frontend_dir),
            env={
                **os.environ,
                "VITE_BACKEND_URL": cls.live_server_url,
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
    
    def test_create_workout(self):
        # Load exercises
        call_command("loaddata", "exercises.json")
        
        # Create a test user
        self.test_user = User.objects.create_user(username="testuser", password="somethingThatIsNotSoEasyToGuess2343")
        self.test_profile = UserProfile.objects.create(user=self.test_user)
        # Generate and store JWT tokens
        refresh = RefreshToken.for_user(self.test_user)
        self.access_token = str(refresh.access_token)
        self.refresh_token = str(refresh)
        
        # Set environment variables for the frontend process
        os.environ["VITE_ACCESS_TOKEN"] = self.access_token
        os.environ["VITE_REFRESH_TOKEN"] = self.refresh_token
        os.environ["VITE_USERNAME"] = self.test_user.username
        os.environ["VITE_USER_TYPE"] = str(self.test_profile.role) 
        
        # Navigate to app and login
        self.browser.refresh()
        self.browser.get("http://localhost:5173")

        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        self.browser.find_element(By.NAME, "username").send_keys("testuser")
        self.browser.find_element(By.NAME, "password").send_keys("somethingThatIsNotSoEasyToGuess2343")
        
        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        time.sleep(3)
        
        # Create workout
        create_workout_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "createWorkoutButton"))
        )
        create_workout_button.click()
        
        add_exercises_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "addExercisesButton"))
        )
        
        time.sleep(3)
        
        add_exercises_button.click()
        
        
        # Select exercise
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-id='7']"))
        )
        
        exercise_option = self.browser.find_element(By.CSS_SELECTOR, "div[data-id='7']")
        time.sleep(3)
        exercise_option.click()
        
        confirm_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "confirmSelectionButton"))
        )
        time.sleep(3)
        confirm_button.click()
        
        # Name and create workout
        workout_name_field = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "workoutName"))
        )
        workout_name_field.send_keys("Test workout")
        
        confirm_create_workout = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "createWorkoutButton"))
        )
        time.sleep(3)
        confirm_create_workout.click()
        
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.NAME, "createWorkoutButton"))
        )
        
        time.sleep(5)
        
        print("Workout created successfully!")
        
        