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
import unittest


class WorkoutSessionTest(StaticLiveServerTestCase):
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
    
    def test_create_workout_session(self):
        # Load exercises
        call_command("loaddata", "exercises.json")
        
        # Create a test user
        self.test_user = User.objects.create_user(username="testuser", password="somethingThatIsNotSoEasyToGuess2343")
        self.test_profile = UserProfile.objects.create(user=self.test_user, weight=70, height=175)
        
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
        
        time.sleep(5)
        
        start_workout_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "startWorkoutButton"))
        )
        
        start_workout_button.click()
        time.sleep(5)
        
        exercise_sections = WebDriverWait(self.browser, 10).until (
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.bg-gray-700.p-4.rounded-lg.shadow-md"))
        )  
        
        for section in exercise_sections:
            # Get the exercise name
            exercise_name = section.find_element(By.CSS_SELECTOR, "h2.text-lg.font-semibold").text
            
            
            # Locate first set weight & repetitions by unique name
            weight_input = section.find_element(By.NAME, f"weight-{exercise_name}-1")
            repetitions_input = section.find_element(By.NAME, f"reps-{exercise_name}-1")
            
            weight_input.send_keys("50")
            repetitions_input.send_keys("10")
            
            # Click the "Add Set" button for this exercise
            add_set_button = section.find_element(By.NAME, f"addSet-{exercise_name}")
            add_set_button.click()
        
        for section in exercise_sections:
            # Get the exercise name
            exercise_name = section.find_element(By.CSS_SELECTOR, "h2.text-lg.font-semibold").text
            
            
            # Locate first set weight & repetitions by unique name
            weight_input = section.find_element(By.NAME, f"weight-{exercise_name}-2")
            repetitions_input = section.find_element(By.NAME, f"reps-{exercise_name}-2")
            
            weight_input.send_keys("60")
            repetitions_input.send_keys("8")
        
        time.sleep(5)
        
        save_session_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "saveButton"))
        )
        
        save_session_button.click() 
        time.sleep(5)
        print("Successfully saved workout session!")
            
                                                                                                  
    
        
        
        
        
        