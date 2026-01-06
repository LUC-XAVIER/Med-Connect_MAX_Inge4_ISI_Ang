import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  menuActive = false;
  showScrollTop = false;
  currentTestimonial = 0;
  currentSlide = 0;
  carouselInterval: any;

  blogs = [
    {
      title: 'Secure Medical Record Storage',
      description: 'Learn how Med-Connect uses industry-leading encryption to keep your medical records safe and accessible.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop'
    },
    {
      title: 'Connect with Healthcare Providers',
      description: 'Discover how to share your complete medical history with doctors for better diagnosis and treatment.',
      image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=300&fit=crop'
    },
    {
      title: 'Access Your Records Anywhere',
      description: 'Your health records are available 24/7 from any device, ensuring continuity of care wherever you go.',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop'
    }
  ];

  testimonials = [
    {
      text: 'Med-Connect has revolutionized how I manage my health records. Being able to share my complete medical history with my new doctor saved so much time and prevented duplicate tests. Highly recommended!',
      author: 'Sarah Johnson',
      position: 'Patient',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
      text: 'As a healthcare provider, having instant access to my patients\' complete medical history has improved diagnosis accuracy and treatment outcomes significantly. Med-Connect is a game-changer.',
      author: 'Dr. Michael Chen',
      position: 'Cardiologist',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop'
    },
    {
      text: 'The security and ease of use are outstanding. I finally have all my medical records in one place, and I can control who sees what. It gives me peace of mind.',
      author: 'Robert Martinez',
      position: 'Patient',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.observeElements();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop = window.pageYOffset > 300;
    this.animateOnScroll();
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
  }

  scrollToSection(sectionId: string) {
    this.menuActive = false;
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  previousTestimonial() {
    this.currentTestimonial = (this.currentTestimonial - 1 + this.testimonials.length) % this.testimonials.length;
  }

  nextTestimonial() {
    this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
  }

  startCarousel() {
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  previousSlide() {
    this.currentSlide = (this.currentSlide - 1 + 4) % 4;
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % 4;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  private observeElements() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1
    });

    setTimeout(() => {
      const elements = document.querySelectorAll('.fade-in, .fade-in-up, .slide-up, .zoom-in');
      elements.forEach(el => observer.observe(el));
    }, 100);
  }

  private animateOnScroll() {
    const elements = document.querySelectorAll('.fade-in-up, .zoom-in, .slide-up');

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight * 0.85) {
        element.classList.add('visible');
      }
    });
  }
}
