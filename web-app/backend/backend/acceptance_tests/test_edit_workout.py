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


class EditWorkoutTest(StaticLiveServerTestCase):
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
                "VITE_ACCESS_TOKEN": "",  # Initially empty, set later
                "VITE_REFRESH_TOKEN": "",  # Initially empty, set later
                "VITE_USERNAME": "",       # Initially empty, set later
                "VITE_USER_TYPE": "",      # Initially empty, set later
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
    
    def test_edit_workout(self):
        # Load exercises
        call_command("loaddata", "exercises.json")
        
        # Create a test user
        self.test_user = User.objects.create_user(username="testuser", password="password")
        self.test_profile = UserProfile.objects.create(user=self.test_user, weight=70, height=175)
        
        exercises = Exercise.objects.all()
        # Create a test workout
        self.test_workout = Workout.objects.create(author=self.test_user, name="Test Workout")
        self.test_workout.exercises.set(exercises[:2]) 

        
        
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
        self.browser.find_element(By.NAME, "password").send_keys("password")
        
        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        time.sleep(5)
        
        view_workout_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "viewWorkoutButton"))
        )
        view_workout_button.click()
        
        time.sleep(5)

        # Delete the first exercise
        delete_buttons = WebDriverWait(self.browser, 5).until(
            EC.presence_of_all_elements_located((By.NAME, "deleteExercise"))
        )
        delete_buttons[0].click() 
        
        # Edit the selected exercise to a new exercise
        edit_exercise_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "editExercises"))
        )
        edit_exercise_button.click()
        
        # Wait for the edit exercises page
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.ID, "exerciseList"))
        )

        time.sleep(5)
        # Select a new exercise
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "li[data-id='9']"))
        )
        
        exercise_option = self.browser.find_element(By.CSS_SELECTOR, "li[data-id='9']")
        exercise_option.click()

        
        # Click confirm selection of exercises
        confirm_button = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "confirmSelectionButton"))
        )
        confirm_button.click()
        
        WebDriverWait(self.browser, 5).until(
            EC.presence_of_element_located((By.NAME, "workoutName"))
        )
        
        self.workout_name_field = self.browser.find_element(By.NAME, "workoutName")
        self.workout_name_field.clear()
        time.sleep(5)
        self.workout_name_field.send_keys("New Workout Name")
        
        time.sleep(5)
        
        # Confirm the edit of the workout
        confirm_edit_workout = WebDriverWait(self.browser, 5).until(
            EC.element_to_be_clickable((By.NAME, "saveWorkout"))
        )
        confirm_edit_workout.click()

        time.sleep(5)

        print("Successfully edited workout!")
        
        
        
        
        
        
