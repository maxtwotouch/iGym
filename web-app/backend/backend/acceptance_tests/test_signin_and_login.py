from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import subprocess
from django.conf import settings
import os
import time

class SignInAndLogInTest(StaticLiveServerTestCase):
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
            env={**os.environ, "VITE_BACKEND_URL": cls.live_server_url},
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
    
    def test_sign_in_and_login(self):
        self.browser.get("http://localhost:5173")

        # Click register button
        register_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "registrationButton"))
        )
        register_button.click()

        # Wait for the registration page
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.NAME, "username"))
        )

        # Fill out the registration page
        self.browser.find_element(By.NAME, "username").send_keys("testuser")
        self.browser.find_element(By.NAME, "password").send_keys("password")
        self.browser.find_element(By.NAME, "userType").send_keys("user")
        self.browser.find_element(By.NAME, "weight").send_keys("70")
        self.browser.find_element(By.NAME, "height").send_keys("175")

        # Click submit button on registration page
        submit_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "submitButton"))
        )
        submit_button.click()

        # Handle alert if present (pop up for successful registration)
        try:
            WebDriverWait(self.browser, 5).until(EC.alert_is_present())
            alert = self.browser.switch_to.alert
            alert.dismiss()
        except Exception:
            print("No alert present after registration.")

        # Wait for login page
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.NAME, "username"))
        )

        time.sleep(5)

        # Fill out the login page
        self.browser.find_element(By.NAME, "username").send_keys("testuser")
        self.browser.find_element(By.NAME, "password").send_keys("password")

        # Click login button
        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()

        # Wait for dashboard page
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.NAME, "username"))
        )

        time.sleep(5)

        print("Successfully logged in and reached dashboard!")

    # def test_workout_creation_and_edit(self):
    #     self.test_sign_in_and_login()

    #     # Click create workout button
    #     create_workout_button = WebDriverWait(self.browser, 10).until(
    #         EC.element_to_be_clickable((By.NAME, "createWorkoutButton"))
    #     )
    #     create_workout_button.click()

    #     # Click add exercises button
    #     add_exercises_button = WebDriverWait(self.browser, 10).until(
    #         EC.element_to_be_clickable((By.NAME, "addExercisesButton"))
    #     )
    #     add_exercises_button.click()

    #     # Wait for the add exercises page
    #     WebDriverWait(self.browser, 10).until(
    #         EC.presence_of_element_located((By.ID, "exerciseList"))
    #     )

    #     time.sleep(5)


    #     time.sleep(50)

    #     # Select an exercise
    #     exercise_option = self.browser.find_element(By.CSS_SELECTOR, "option[data-id='1']")
    #     exercise_option.click()

    #     # Click confirm selection of exercises
    #     confirm_button = WebDriverWait(self.browser, 5).until(
    #         EC.element_to_be_clickable((By.NAME, "confirmSelectionButton"))
    #     )
    #     confirm_button.click()

    #     # Give name to the workout
    #     workout_name_field = WebDriverWait(self.browser, 5).until(
    #         EC.element_to_be_clickable((By.NAME, "workoutName"))
    #     )
    #     workout_name_field.send_keys("Test workout")

    #     # Confirm creation of new workout
    #     confirm_create_workout = WebDriverWait(self.browser, 5).until(
    #         EC.element_to_be_clickable((By.NAME, "createWorkoutButton"))
    #     )
    #     confirm_create_workout.click()

    #     # Wait until locateed the created workout in the workout list
    #     WebDriverWait(self.browser, 5).until(
    #         EC.presence_of_element_located((By.ID, "workoutElement"))
    #     )

    #     # Click view workout for editing
    #     view_workout_button = WebDriverWait(self.browser, 5).until(
    #         EC.element_to_be_clickable((By.NAME, "viewWorkoutButton"))
    #     )
    #     view_workout_button.click()

    #     # Wait for the workout detail page
    #     WebDriverWait(self.browser, 5).until(
    #         EC.presence_of_element_located((By.NAME, "workoutName"))
    #     )

    #     # Edit the selected exercise to a new exercise
    #     edit_exercise_button = WebDriverWait(self.browser, 5).until(
    #         EC.element_to_be_clickable((By.NAME, "editExercises"))
    #     )
    #     edit_exercise_button.click()

    #     # Wait for the edit exercises page
    #     WebDriverWait(self.browser, 10).until(
    #         EC.presence_of_element_located((By.ID, "exerciseList"))
    #     )

    #     time.sleep(5)

    #     # Remove selection of the first exercise
    #     exercise_option = self.browser.find_element(By.CSS_SELECTOR, "option[data-id='1']")
    #     exercise_option.click()

    #     # Select an exercise
    #     exercise_option = self.browser.find_element(By.CSS_SELECTOR, "option[data-id='2']")
    #     exercise_option.click()

    #     # Click confirm selection of exercises
    #     confirm_button = WebDriverWait(self.browser, 5).until(
    #         EC.element_to_be_clickable((By.NAME, "confirmSelectionButton"))
    #     )
    #     confirm_button.click()

    #     time.sleep(5)

    #     # Confirm the edit of the workout
    #     confirm_edit_workout = WebDriverWait(self.browser, 5).until(
    #         EC.element_to_be_clickable((By.NAME, "saveWorkout"))
    #     )
    #     confirm_edit_workout.click()
