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
from backend.models import Exercise, UserProfile
from django.conf import settings
from pathlib import Path
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class SignInAndLogInTest(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        print(f"Setting backend URL for frontend: {cls.live_server_url}")
        
        # Set environment variable in frontend
        env_path = r"C:\Users\danie\Documents\INF-2900\web-app\frontend\.env"
        with open(env_path, "w") as f:
            f.write(f"VITE_BACKEND_URL={cls.live_server_url}\n")

        # Start frontend based on OS
        frontend_dir = Path(settings.BASE_DIR).parent / "frontend"
        if (os.name == "posix"):
            npm_command = "npm"
        elif (os.name == "nt"):
            npm_command = r"C:\Program Files\nodejs\npm.cmd"
        
        cls.frontend_process = subprocess.Popen(
            [npm_command, "run", "dev"],
            cwd=str(frontend_dir),
            env={**os.environ, "VITE_BACKEND_URL": cls.live_server_url},
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        
        time.sleep(10)  # Wait for frontend to start

        # Set up WebDriver
        options = Options()
        if os.name == "nt":
            options.binary_location = r"C:\Program Files\Mozilla Firefox\firefox.exe"
        options.headless = False
        cls.browser = webdriver.Firefox(options=options)
    
    @classmethod
    def tearDownClass(cls):
        # Reset environment variables
        env_path = r"C:\Users\danie\Documents\INF-2900\web-app\frontend\.env"
        with open(env_path, "w") as f:
            f.write("")
        
        cls.browser.quit()
        cls.frontend_process.terminate()
        super().tearDownClass()

    @classmethod
    def setUpTestData(cls):
        call_command("loaddata", "exercises.json")

    def test_sign_in_and_login(self):
        self.browser.get("http://localhost:5173")
        
        # Navigate to registration page
        register_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "registrationButton"))
        )
        register_button.click()
        
        # Fill registration form
        WebDriverWait(self.browser, 10).until(EC.presence_of_element_located((By.NAME, "username")))
        self.browser.find_element(By.NAME, "username").send_keys("testuser")
        self.browser.find_element(By.NAME, "password").send_keys("password")
        self.browser.find_element(By.NAME, "userType").send_keys("user")
        self.browser.find_element(By.NAME, "weight").send_keys("70")
        self.browser.find_element(By.NAME, "height").send_keys("175")
        
        # Submit registration
        submit_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "submitButton"))
        )
        submit_button.click()
        
        # Handle alert if present
        try:
            WebDriverWait(self.browser, 5).until(EC.alert_is_present())
            self.browser.switch_to.alert.dismiss()
        except Exception:
            print("No alert present after registration.")
        
        # Fill login form
        WebDriverWait(self.browser, 10).until(EC.presence_of_element_located((By.NAME, "username")))
        time.sleep(5)
        
        self.browser.find_element(By.NAME, "username").send_keys("testuser")
        self.browser.find_element(By.NAME, "password").send_keys("password")
        
        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        # Verify dashboard is reached
        WebDriverWait(self.browser, 10).until(EC.presence_of_element_located((By.NAME, "username")))
        time.sleep(5)
        
        self.browser.refresh()
        self.browser.get("http://localhost:5173")
        print("Successfully logged in and reached dashboard!")

    def test_workout_creation_and_edit(self):
        # Load exercise data and verify
        call_command("loaddata", "exercises.json")
        exercises = Exercise.objects.all()
        print("DEBUG: Exercises in test database:")
        for e in exercises:
            print(f" - {e.id}: {e.name}")
        
        # Create test user with profile
        self.test_user = User.objects.create_user(username="testuser", password="password")
        self.test_profile = UserProfile.objects.create(user=self.test_user, weight=70, height=175, role="user")
        
        # Generate and store JWT tokens
        refresh = RefreshToken.for_user(self.test_user)
        self.access_token = str(refresh.access_token)
        self.refresh_token = str(refresh)
        
        env_path = r"C:\Users\danie\Documents\INF-2900\web-app\frontend\.env"
        with open(env_path, "a") as f:
            f.write(f"VITE_ACCESS_TOKEN={self.access_token}\n")
            f.write(f"VITE_REFRESH_TOKEN={self.refresh_token}\n")
            f.write(f"VITE_USERNAME={self.test_user.username}\n")
            f.write(f"VITE_USER_TYPE={self.test_profile.role}\n")
            f.write(f"VITE_USER_ID={self.test_user.id}\n")
        
        # Navigate to app and login
        self.browser.refresh()
        time.sleep(5)
        self.browser.get("http://localhost:5173")
        
        login_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        self.browser.find_element(By.NAME, "username").send_keys("testuser")
        self.browser.find_element(By.NAME, "password").send_keys("password")
        
        login_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        # Create workout
        create_workout_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "createWorkoutButton"))
        )
        create_workout_button.click()
        
        add_exercises_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "addExercisesButton"))
        )
        add_exercises_button.click()
        
        # Select exercise
        WebDriverWait(self.browser, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "li[data-id='1']"))
        )
        
        exercise_option = self.browser.find_element(By.CSS_SELECTOR, "li[data-id='1']")
        exercise_option.click()
        
        confirm_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "confirmSelectionButton"))
        )
        confirm_button.click()
        
        # Name and create workout
        workout_name_field = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "workoutName"))
        )
        workout_name_field.send_keys("Test workout")
        
        confirm_create_workout = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "createWorkoutButton"))
        )
        confirm_create_workout.click()
        
        # View and edit workout
        WebDriverWait(self.browser, 5).until(
            EC.presence_of_element_located((By.ID, "workoutElement"))
        )
        
        view_workout_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "viewWorkoutButton"))
        )
        view_workout_button.click()
        
        WebDriverWait(self.browser, 5).until(
            EC.presence_of_element_located((By.NAME, "workoutName"))
        )
        
        # Edit exercises
        edit_exercise_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "editExercises"))
        )
        edit_exercise_button.click()
        
        WebDriverWait(self.browser, 5).until(
            EC.presence_of_element_located((By.ID, "exerciseList"))
        )
        
        # Change exercise selection
        exercise_option = self.browser.find_element(By.CSS_SELECTOR, "li[data-id='1']")
        exercise_option.click()
        
        exercise_option = self.browser.find_element(By.CSS_SELECTOR, "li[data-id='2']")
        exercise_option.click()
        
        confirm_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "confirmSelectionButton"))
        )
        confirm_button.click()
        
        # Save workout changes
        confirm_edit_workout = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "saveWorkout"))
        )
        confirm_edit_workout.click()

        print("Workout creation and edit successful!")