import '../style/common.css';
import Navbar from '@/components/intro-nav';
import Footer from '../components/footer';

export default function IntroPage() {
  return (
    <>
    <div className="body">
      <Navbar /> 
      
      <div className="advertise-board">
        <img src="/images/logo.png" alt="Alt+Calories Logo" className="Logo" style={{ float: 'left', width: '140px', height: '40px' }} />
        <img className="Advi-model" src="/images/Advi-model.png" alt="Advimodel" />
        <h1>FITNESS</h1>
        <h3 style={{ float:'right',marginRight:'5px' }}>Reset Your Body. Delete the Calories.</h3>
        <p style={{ marginTop:'50px' }}>
          We are here to help you reset your lifestyle and eliminate unhealthy habits.
          Whether you're <br /> tracking calories, following custom workout plans, or staying
          motivated through daily <br /> challenges, our tech-inspired interface makes fitness
          feel fresh, fun, and achievable. <br /> It's time to upgrade your health—one click,
          one rep, one calorie at a time.
        </p>
        <a href="/Login" className="Advertise-btn">Start Now!</a>
      </div>

      <div className="intro-Workout section-row" style={{height:'650px',marginTop:'-80px'}}>
        <div className="section-image">
          <img src="/images/Workout and food.jpg" alt="Replacement" className="Advi-Small-img" />
        </div>
        <div className="section-text" style={{verticalAlign:'middle'}}>
          <h1 style={{width:'100%'}}>Workout & Food Calories Library</h1>
          <h3 style={{textAlign:'right', marginLeft:'0px',marginTop:'20px'}}>Discover smarter choices.</h3>
          <p style={{textAlign:'right'}}>
            Explore our extensive library of workouts and food items, complete with calorie counts and health insights.
            Whether you're planning a meal or burning off the extra snack, this is your go-to database for making informed fitness decisions.
          </p>
          <a href="/Login" className="Explore-Btn">Explore Now</a>
        </div>
      </div>

      <div className="intro-Community section-row" style={{bottom:'-50px'}}>
        <div className="section-text-left">
          <h1 style={{textAlign:'left', marginLeft:'0px',marginTop:'20px'}}>Community Feed</h1>
          <h3 style={{textAlign:'left', marginLeft:'0px',marginTop:'20px'}}>Connect, share, and stay inspired.</h3>
          <p style={{marginLeft:'0px'}}>
            Join a supportive fitness community where you can post photos,
            comment, and cheer each other on. Celebrate progress, swap tips, or just show off that post-workout glow—you're not on this journey alone.
          </p>
          <a href="/Login" className="Explore-Btn-left">Explore Now</a>
        </div>

        <div className="section-image">
          <img src="/images/Fitness Community.jpg" alt="Community Feed" />
        </div>
      </div>

      <div className="intro-Workout section-row" style={{marginTop:'-200px',marginBottom:'0px'}}>
        <div className="section-image">
          <img src="/images/Customize plan.jpeg" alt="Replacement" className="Advi-Small-img" style={{ float: 'left'}}/>
        </div>
        <div className="section-text"  style={{ textAlign: 'right !important'}}>
          <h1 style={{marginRight:'0px'}}>Personalized Workout Plans</h1>
          <h3 style={{marginLeft:'0px',marginRight:'0px',marginTop:'20px'}}>Train with purpose.</h3>
          <p style={{marginLeft:'0px',marginRight:'0px'}}>
            Get tailored workout plans that match your goals, 
            schedule, and fitness level. Whether you're a beginner or a pro, our structured routines guide you step-by-step to keep you motivated and progressing.
          </p>
          <a href="/Login" className="Explore-Btn" style={{marginRight:'-25px'}}>Explore Now</a>
        </div>
      </div>


      <Footer />
    </div>
    </>
    
  );
}
