# from django.contrib.staticfiles.testing import StaticLiveServerTestCase
# from selenium import webdriver
# from selenium.webdriver.firefox.options import Options
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium.webdriver.common.by import By
# import subprocess
# import os
# import time
# from django.core.management import call_command
# from backend.models import UserProfile, WorkoutSession, Set, Exercise, Workout, ExerciseSession
# from django.conf import settings
# from django.contrib.auth.models import User
# import unittest
# from datetime import datetime, timedelta

# class CalendarTest(StaticLiveServerTestCase):
#     @classmethod
#     def setUpClass(cls):
#         super().setUpClass()
        
#         frontend_dir = settings.BASE_DIR.parent / "frontend"
#         env_path = frontend_dir / ".env"

#         # Set environment variable in frontend
#         with open(env_path, "w") as f:
#             f.write(f"VITE_BACKEND_URL={cls.live_server_url}\n")

#         # Start frontend
#         cls.frontend_process = subprocess.Popen(
#             ["npm", "run", "dev"],
#             cwd=str(frontend_dir),
#             env={
#                 **os.environ,
#                 "VITE_BACKEND_URL": cls.live_server_url,    
#             },
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#         )
        
#         # Give some time for the frontend to start
#         time.sleep(10)

#         # Set up WebDriver (Firefox)
#         options = Options()
#         options.headless = False
        
#         cls.browser = webdriver.Firefox(options=options)

#     @classmethod
#     def tearDownClass(cls):
#         # Reset the environment variable in the frontend
#         frontend_dir = settings.BASE_DIR.parent / "frontend"
#         env_path = frontend_dir / ".env"
        
#         with open(env_path, "w") as f:
#             f.write("")

#         cls.browser.quit()
#         cls.frontend_process.terminate()
#         super().tearDownClass()
    
#     def test_calendar(self):
#         call_command("loaddata", "exercises.json")
        
#         self.user = User.objects.create_user(username="testUser", password="somethingThatIsNotSoEasyToGuess2343")
#         self.user_profile = UserProfile.objects.create(user=self.user)
        
#         self.workout = Workout.objects.create(name="test workout", author=self.user)
#         self.workout.owners.add(self.user)
#         self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
#         self.workout.exercises.set([self.exercise])
        
#         self.duration = timedelta(hours=1, minutes=30, seconds=0)
        
#         self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=120.5, duration=self.duration)

#         # Add an exercise session
#         self.exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)
#         self.set = Set.objects.create(exercise_session=self.exercise_session, repetitions=10, weight=50)
        
#         self.browser.refresh()
#         self.browser.get("http://localhost:5173")
        
#         login_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "loginButton"))
#         )
#         login_button.click()
        
#         self.browser.find_element(By.NAME, "username").send_keys("testUser")
#         self.browser.find_element(By.NAME, "password").send_keys("somethingThatIsNotSoEasyToGuess2343")
        
#         login_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "loginButton"))
#         )
#         login_button.click()
#         time.sleep(5)
        
#         calendar_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-name="Calendar"]'))
#         )
    
#         calendar_button.click()
#         time.sleep(5)      
        
#         today_cell = WebDriverWait(self.browser, 10).until(
#             EC.presence_of_element_located((By.CSS_SELECTOR, 'div.ring-blue-500'))
#         )
        
#         # Find the workout session event within today's cell
#         workout_event = WebDriverWait(self.browser, 10).until(
#             EC.presence_of_element_located((By.CSS_SELECTOR, 'div.text-xs.truncate.bg-blue-600'))
#         )
        
#         workout_event.click()
#         time.sleep(5)
        
#         close_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "closeButton"))
#         )
        
#         close_button.click()
#         time.sleep(5)
        
#         tomorrow_day = (datetime.now() + timedelta(days=1)).day
        
#         tomorrow_cell = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((
#                 By.XPATH,
#                 f'//div[contains(@class, "bg-gray-800") and not(contains(@class, "opacity-50"))]//span[text()="{tomorrow_day}"]/ancestor::div[contains(@class, "flex-col")]'
#             ))
#         )
#         tomorrow_cell.click()
#         time.sleep(5)
        
#         # Find the dropdown menu of workouts
#         workout_dropdown = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, 'workoutSelect'))
#         )
#         workout_dropdown.click()
#         time.sleep(5) 
        
#         workout = WebDriverWait(self.browser, 10).until(
#             EC.presence_of_element_located(
#                 (By.CSS_SELECTOR, f'option[data-id="{self.workout.id}"]')
#             )
#         )
        
#         workout.click()
#         time.sleep(5)
        
#         schedule_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "scheduleButton"))
#         )
        
#         schedule_button.click()
#         time.sleep(5)
        
#         print("Successfully scheduled a workout!")