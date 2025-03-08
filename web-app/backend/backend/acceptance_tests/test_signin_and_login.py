from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import subprocess
import os
import time
from selenium.webdriver.firefox.options import Options



class SignInAndLogInTest(StaticLiveServerTestCase):
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        os.environ['REACT_APP_BACKEND_URL'] = cls.live_server_url
        
        cls.frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd = "/Users/andreasnergard/programmering/INF-2900/INF-2900/web-app/frontend",
            env=os.environ,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        
        time.sleep(5)
        
        options = Options()
        options.headless = False
        
        cls.browser = webdriver.Firefox(options=options)
        
    

    @classmethod
    def tearDownClass(cls):
        cls.browser.quit()
        cls.frontend_process.terminate()
       
        super().tearDownClass()


    def test_signInAndLogin(self):
        self.browser.get("http://localhost:5173")
        
        register_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "registrationButton"))
        )
        register_button.click()
        
        WebDriverWait(self.browser, 20).until(
            EC.presence_of_element_located((By.NAME, 'username'))  # Wait for the login username field
        )

        # Fill out registration form
        username_field = self.browser.find_element(By.NAME, 'username')
        password_field = self.browser.find_element(By.NAME, 'password')
        user_type_field = self.browser.find_element(By.NAME, "userType")
        weight_field = self.browser.find_element(By.NAME, 'weight')
        height_field = self.browser.find_element(By.NAME, 'height')

        username_field.send_keys('testuser')
        password_field.send_keys('password')
        user_type_field.send_keys('user')
        weight_field.send_keys('70')
        height_field.send_keys('175')

        submit_button = self.browser.find_element(By.NAME, "submitButton")
        submit_button.click()
        
        try:
            WebDriverWait(self.browser, 5).until(EC.alert_is_present())
            alert = self.browser.switch_to.alert
            alert.dismiss()
        
        except Exception as e:
            print("No alert present:", e)

        # Wait for the page to change and login fields to be available
        WebDriverWait(self.browser, 10).until(
            EC.presence_of_element_located((By.NAME, 'username'))  # Wait for the login username field
        )

        # Re-fetch the login fields
        login_username_field = self.browser.find_element(By.NAME, 'username')
        login_password_field = self.browser.find_element(By.NAME, 'password')
        
        # Send keys to login fields
        login_username_field.send_keys('testuser')
        login_password_field.send_keys('password')
        
        # Wait for login button to be clickable before clicking
        login_button = WebDriverWait(self.browser, 10).until(
            EC.element_to_be_clickable((By.NAME, "loginButton"))
        )
        login_button.click()
        
        WebDriverWait(self.browser, 10)
        
        self.browser.quit()
        
        
        
        
        


            
        
