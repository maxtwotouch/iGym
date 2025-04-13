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
from backend.models import UserProfile, WorkoutSession, Set, Exercise, Workout, ExerciseSession, PersonalTrainerProfile, ScheduledWorkout
from django.conf import settings
from django.contrib.auth.models import User
import unittest
from datetime import datetime, timedelta
from django.utils.timezone import now

class TestPTCanSeeClientsSessions(StaticLiveServerTestCase):

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
    
    def test_pt_can_see_clients_sessions(self):
        call_command("loaddata", "exercises.json")
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, personal_trainer=self.trainer_profile)

        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout.owners.add(self.user)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout.exercises.set([self.exercise])
        
        self.duration = timedelta(hours=1, minutes=30, seconds=0)
        
        self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=120.5, duration=self.duration)
        
        # Add an exercise session
        self.exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)
        self.set = Set.objects.create(exercise_session=self.exercise_session, repetitions=10, weight=50)
        
        self.scheduled_date = now() + timedelta(days=1)
        self.scheduled_workout = ScheduledWorkout.objects.create(user=self.user, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
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
        
        # Find the dropdown menu of clients
        client_drowpdown = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "clientButton"))
        )
        client_drowpdown.click()
        time.sleep(5)
        
        # Select client
        client = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, f"li[data-id='{self.user.id}']"))
        )
        client.click()
        time.sleep(5)
        
        # Find today's date cell
        today_cell = WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '.fc-day-today'))
        )
        
        # Find the workout session event within today's cell
        workout_event = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '.fc-event'))
        )
        workout_event.click()
        time.sleep(5)
        
        close_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "closeButton"))
        )
        close_button.click()
        time.sleep(5)
    
        # Calculate tomorrow's date in YYYY-MM-DD format
        tomorrow_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        tomorrow_cell = WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, f'td.fc-day[data-date="{tomorrow_date}"]'))
        )
        tomorrow_cell.click()
        time.sleep(5)
        
        print("Successfully found client's sessions")
        
        
        
        
        