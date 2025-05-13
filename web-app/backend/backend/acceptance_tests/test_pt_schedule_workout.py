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
from backend.models import UserProfile, Workout, PersonalTrainerProfile
from django.conf import settings
from django.contrib.auth.models import User
import unittest
from datetime import datetime, timedelta

class PtScheduleWorkoutTest(StaticLiveServerTestCase):
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
    
    def test_pt_schedule_workout(self):
        call_command("loaddata", "exercises.json")
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.client = User.objects.create_user(username="testuser", password="password")
        self.client_profile = UserProfile.objects.create(user=self.client, personal_trainer=self.trainer_profile)
        
        self.workout = Workout.objects.create(name="test workout", author=self.trainer)
        self.workout.owners.add(self.trainer)
        
        self.browser.refresh()
        self.browser.get("http://localhost:5173")

        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        self.browser.find_element(By.NAME, "username").send_keys("testTrainer")
        self.browser.find_element(By.NAME, "password").send_keys("password")
        
        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        time.sleep(5)
        
        calendar_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-name="Calendar"]'))
        )
        calendar_button.click()
        time.sleep(5)
        
        tomorrow_str = (datetime.today() + timedelta(days=1)).strftime('%Y-%m-%d')

        tomorrow_cell = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((
                By.CSS_SELECTOR,
                f'div[data-date="{tomorrow_str}"]'
            ))
        )
        tomorrow_cell.click()
        time.sleep(5)
        
        # Find the dropdown menu of clients
        client_dropdown = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "clientSelect"))
        )
        client_dropdown.click()
        time.sleep(5)
        
        # Select a client from the dropdown
        client = WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, f'option[data-id="{self.client.id}"]'))
        )
        client.click()
        time.sleep(5)
        
        workout_dropdown = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "workoutSelect"))
        )
        workout_dropdown.click()
        time.sleep(5)
        
        workout = WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, f'option[data-id="{self.workout.id}"]'))
        )
        workout.click()
        time.sleep(5)
        
        schedule_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "scheduleButton"))
        )
        schedule_button.click()
        time.sleep(5)
        
        home_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-name="Home Page"]'))
        )
        home_button.click()
        time.sleep(5)
        
        print("Successfully scheduled workout with client!")
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        

        
        
        

