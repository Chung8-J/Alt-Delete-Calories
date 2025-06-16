import Link from 'next/link';
import '../style/common.css';
import Navbar from '@/components/intro-nav';
import Image from 'next/image';

export default function IntroPage() {
  return (
    <div className="body">
      <Navbar />

      <div className="advertise-board">
        <h2>Logo</h2>
        <Image
          className="Advi-model"
          src="/images/Advi-model.png"
          alt="Advimodel"
          width={400}
          height={400}
        />
        <h1>FITNESS</h1>
        <h3>Reset Your Body. Delete the Calories.</h3>
        <p>
          We are here to help you reset your lifestyle and eliminate unhealthy habits.
          Whether you're <br /> tracking calories, following custom workout plans, or staying
          motivated through daily <br /> challenges, our tech-inspired interface makes fitness
          feel fresh, fun, and achievable. <br /> It's time to upgrade your health—one click,
          one rep, one calorie at a time.
        </p>
        <a href="#" className="Advertise-btn">Start Now!</a>
      </div>

      <div className="intro-Workout section-row">
        <div className="section-image">
          <Image
            src="/images/Replacement picture.jpg"
            alt="Workout & Food Calorie Library"
            className="Advi-Small-img"
            width={400}
            height={400}
          />
        </div>
        <div className="section-text">
          <h1>Workout & Food Calorie Library</h1>
          <h3>Discover smarter choices.</h3>
          <p>
            Explore our extensive library of workouts and food items, complete with calorie counts and health insights.
            Whether you're planning a meal or burning off the extra snack, this is your go-to database for making informed fitness decisions.
          </p>
          <a href="#" className="Explore-Btn">Explore Now</a>
        </div>
      </div>

      <div className="intro-Community section-row">
        <div className="section-text-left">
          <h1>Community Feed</h1>
          <h3>Connect, share, and stay inspired.</h3>
          <p>
            Join a supportive fitness community where you can post photos,
            comment, and cheer each other on. Celebrate progress, swap tips, or just show off that post-workout glow—you're not on this journey alone.
          </p>
          <a href="#" className="Explore-Btn-left">Explore Now</a>
        </div>
        <div className="section-image">
          <Image
            src="/images/Replacement picture.jpg"
            alt="Community Feed"
            className="Advi-Small-img-right"
            width={400}
            height={400}
          />
        </div>
      </div>

      <div className="intro-Workout section-row">
        <div className="section-image">
          <Image
            src="/images/Replacement picture.jpg"
            alt="Personalized Workout Plans"
            className="Advi-Small-img"
            width={400}
            height={400}
          />
        </div>
        <div className="section-text">
          <h1>Personalized Workout Plans</h1>
          <h3>Train with purpose.</h3>
          <p>
            Get tailored workout plans that match your goals,
            schedule, and fitness level. Whether you're a beginner or a pro, our structured routines guide you step-by-step to keep you motivated and progressing.
          </p>
          <a href="#" className="Explore-Btn">Explore Now</a>
        </div>
      </div>

      <footer className="footer">
        <div className="ContactUs">
          <h2>Do you need help?</h2>
          <p>We will provide detailed information about our services, types of work, and top projects. We will calculate the cost and prepare a commercial proposal.</p>
        </div>
      </footer>
    </div>
  );
}
