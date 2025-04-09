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
from backend.models import UserProfile, PersonalTrainerProfile
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import unittest


class AssignPtTest(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        frontend_dir = settings.BASE_DIR.parent / "frontend"
        env_path = frontend_dir / ".env"

        # Set environment variable in frontend
        with open(env_path, "w") as f:
            f.write(f"VITE_BACKEND_URL={cls.live_server_url}\n")
        
        # Run npm install to ensure all dependencies are installed
        #subprocess.run(["npm", "install"], cwd=str(frontend_dir), check=True)

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
    
    
    def test_assign_pt(self):
        call_command("loaddata", "exercises.json")
        
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        # Create a personal trainer to choose
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer, experience="5 years", pt_type="strength")
        
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
        
        time.sleep(3)
        
        select_pt_buton = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-name="Personal Trainers"]'))
        )
        
        select_pt_buton.click()
        time.sleep(5)
        
        personal_trainer_option = WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, f"div[data-id='{self.trainer.id}']"))
        )
        
        personal_trainer_option.click()
        time.sleep(5)
        
        select_pt_buton = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "selectPtButton"))
        )
        
        select_pt_buton.click()
        time.sleep(5)
        
        try:
            WebDriverWait(self.browser, 5).until(EC.alert_is_present())
            alert = self.browser.switch_to.alert
            alert.dismiss()
        except Exception:
            print("No alert present after selecting pt")
            
        time.sleep(5)
        
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.NAME, "messageField"))
        )
        time.sleep(5)
        print("Successfully selected a personal trainer!")
        
        
        
        