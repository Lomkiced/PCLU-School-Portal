import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[hsl(var(--primary)/0.08)] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(var(--secondary)/0.06)] blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl tracking-tight">PCLU Portal</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          <Link href="#features" className="hover:text-[hsl(var(--foreground))] transition-colors">Features</Link>
          <Link href="#about" className="hover:text-[hsl(var(--foreground))] transition-colors">About</Link>
          <Link href="#contact" className="hover:text-[hsl(var(--foreground))] transition-colors">Contact</Link>
        </div>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors shadow-md shadow-[hsl(var(--primary)/0.25)]"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-semibold mb-8 tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
          Now Available
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Your School,{" "}
          <span className="gradient-text">Reimagined</span>
        </h1>

        <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mb-10 leading-relaxed">
          A modern, all-in-one school management platform for Polytechnic College of La Union.
          Academics, finance, communication — everything in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl bg-[hsl(var(--primary))] text-white font-semibold text-base hover:bg-[hsl(var(--primary-hover))] transition-all shadow-lg shadow-[hsl(var(--primary)/0.3)] hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.4)] hover:-translate-y-0.5"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="px-8 py-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] font-semibold text-base hover:bg-[hsl(var(--muted))] transition-all"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            Comprehensive tools designed for administrators, teachers, students, and parents.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "📚",
              title: "Academic Management",
              desc: "Enrollment, classes, subjects, timetables, and grades — all automated.",
            },
            {
              icon: "💰",
              title: "Finance & Billing",
              desc: "Fee structures, payment tracking, statements of account, and financial reports.",
            },
            {
              icon: "💬",
              title: "Communication Hub",
              desc: "Real-time messaging, group chats, announcements, and push notifications.",
            },
            {
              icon: "📊",
              title: "LMS & Assessments",
              desc: "Content delivery, quizzes with auto-grading, activities, and AI-powered essay grading.",
            },
            {
              icon: "📱",
              title: "Mobile Access",
              desc: "Native mobile apps for teachers, students, and parents. QR attendance scanning.",
            },
            {
              icon: "🔒",
              title: "Secure & Role-Based",
              desc: "JWT authentication, role-based access control, and encrypted data at rest.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group glass rounded-2xl p-7 hover:card-shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <p>&copy; 2026 Polytechnic College of La Union. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[hsl(var(--foreground))] transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-[hsl(var(--foreground))] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
