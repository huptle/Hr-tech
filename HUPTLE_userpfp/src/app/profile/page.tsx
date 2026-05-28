"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCandidateStore } from "@/store/useCandidateStore";
import {
  Mail, Phone, Briefcase, GraduationCap, MapPin, Globe,
  ArrowLeft, Download, CheckCircle2, Link, BookOpen,
  Award, Heart, Code, ExternalLink, Calendar, Building2,
  UserCircle, Languages, FlaskConical, Lightbulb
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ResumeData } from "@/server/services/resume.types";
import { getSessionEmail } from "@/lib/candidate-session";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useCandidateStore();

  useEffect(() => {
    if (profile) return;

    const email = getSessionEmail();
    if (!email) {
      router.replace("/account");
      return;
    }

    fetch(`/api/profile?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.data) {
          router.replace("/account");
          return;
        }
        const row = data.data as Record<string, unknown>;
        const parsed =
          typeof row.parsed_data === "string"
            ? (JSON.parse(row.parsed_data) as ResumeData)
            : (row.parsed_data as ResumeData);
        setProfile({
          name: String(row.name ?? ""),
          email: String(row.email ?? email),
          phone: String(row.phone ?? ""),
          skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
          experience: String(row.experience ?? ""),
          education: String(row.education ?? ""),
          summary: row.summary ? String(row.summary) : undefined,
          resumeUrl: row.resume_url ? String(row.resume_url) : undefined,
          parsed_data: parsed,
        });
      })
      .catch(() => router.replace("/account"));
  }, [profile, router, setProfile]);

  if (!profile) {
    return (
      <DashboardLayout>
        <p className="text-center text-muted-foreground py-20">Loading profile…</p>
      </DashboardLayout>
    );
  }

  const raw = profile.parsed_data;
  const data = (typeof raw === "string" ? JSON.parse(raw) : raw) as ResumeData;
  if (!data?.userInfo?.name) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-12 text-center text-muted-foreground">
          No structured data available for this profile.
        </div>
      </DashboardLayout>
    );
  }

  const { userInfo, workExperience, education, projects, certifications, miscellaneous } = data;

  const formatDate = (d: string) => d;

  // Get initials for profile badge
  const getInitials = () => {
    return userInfo.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-10 space-y-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to dashboard
        </Button>

        {/* Profile Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-primary/20 border border-primary/20 shrink-0 select-none">
              {getInitials()}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{userInfo.name}</h1>
              <div className="flex items-center gap-1.5 text-emerald-500 text-xs bg-emerald-500/10 px-3 py-1 rounded-full w-fit border border-emerald-500/20 font-bold tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Candidate Profile
              </div>
              {userInfo.summary && (
                <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
                  {userInfo.summary}
                </p>
              )}
            </div>
          </div>

          {profile.resumeUrl && (
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:text-foreground h-10 gap-1.5 px-4 text-sm font-bold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-primary" />
              Download Resume
            </a>
          )}
        </header>

        {/* Main Grid content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Main timeline sections) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Work Experience */}
            {workExperience && workExperience.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" /> Work Experience
                </h2>
                <div className="space-y-4">
                  {workExperience.map((exp, i) => (
                    <Card key={i} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="text-lg font-bold text-foreground leading-snug">{exp.role}</h3>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-muted-foreground mt-1">
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-primary/70" />
                                {exp.company}
                              </span>
                              {exp.location && (
                                <>
                                  <span className="text-border">|</span>
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-primary/70" />
                                    {exp.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-accent/40 px-3 py-1.5 rounded-lg whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-primary/70" />
                            {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                            {exp.duration && <span className="text-primary/70 ml-1">({exp.duration})</span>}
                          </div>
                        </div>

                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <ul className="space-y-1.5">
                            {exp.responsibilities.map((r, j) => (
                              <li key={j} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                                <span className="text-primary mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {exp.technologies && exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {exp.technologies.map((tech, j) => (
                              <span key={j} className="px-2.5 py-0.5 bg-primary/5 border border-primary/10 rounded-md text-xs font-bold text-primary">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" /> Education
                </h2>
                <div className="space-y-3">
                  {education.map((edu, i) => (
                    <Card key={i} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5 space-y-2">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="font-bold text-foreground leading-snug">{edu.institution}</h3>
                            <p className="text-sm font-semibold text-muted-foreground mt-1">
                              {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                              {edu.gpa ? ` – GPA: ${edu.gpa}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-accent/40 px-3 py-1.5 rounded-lg whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-primary/70" />
                            {edu.startDate ? `${formatDate(edu.startDate)} – ` : ""}{formatDate(edu.endDate)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {projects && projects.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" /> Projects
                </h2>
                <div className="space-y-3">
                  {projects.map((proj, i) => (
                    <Card key={i} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-foreground leading-snug">{proj.name}</h3>
                              {proj.url && (
                                <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-1">{proj.description}</p>
                          </div>
                        </div>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {proj.technologies.map((tech, j) => (
                              <span key={j} className="px-2.5 py-0.5 bg-accent text-accent-foreground border border-border rounded-md text-xs font-bold">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {certifications && certifications.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Certifications
                </h2>
                <Card className="border-border bg-card shadow-sm">
                  <CardContent className="p-5 divide-y divide-border/60 space-y-3">
                    {certifications.map((cert, i) => (
                      <div key={i} className={`flex items-start justify-between gap-4 ${i > 0 ? "pt-3" : ""}`}>
                        <div>
                          <p className="font-bold text-foreground text-sm">{cert.name}</p>
                          {cert.issuer && (
                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">{cert.issuer}</p>
                          )}
                        </div>
                        {cert.year && (
                          <span className="text-xs font-bold text-muted-foreground bg-accent/40 px-2 py-1 rounded-md whitespace-nowrap">{cert.year}</span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Publications */}
            {miscellaneous?.publications && miscellaneous.publications.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Publications
                </h2>
                <Card className="border-border bg-card shadow-sm">
                  <CardContent className="p-5">
                    <ul className="space-y-2 list-none">
                      {miscellaneous.publications.map((pub, i) => (
                        <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                          <span className="text-primary mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{pub}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Volunteer Work */}
            {miscellaneous?.volunteerWork && miscellaneous.volunteerWork.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" /> Volunteer Work
                </h2>
                <Card className="border-border bg-card shadow-sm">
                  <CardContent className="p-5">
                    <ul className="space-y-2 list-none">
                      {miscellaneous.volunteerWork.map((v, i) => (
                        <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                          <span className="text-primary mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Patents */}
            {miscellaneous?.patents && miscellaneous.patents.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" /> Patents
                </h2>
                <Card className="border-border bg-card shadow-sm">
                  <CardContent className="p-5">
                    <ul className="space-y-2 list-none">
                      {miscellaneous.patents.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                          <span className="text-primary mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Other Info */}
            {miscellaneous?.other && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-primary" /> Additional Information
                </h2>
                <Card className="border-border bg-card shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{miscellaneous.other}</p>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>

          {/* Right Column (Contact card, skills, languages) */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-primary" /> Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {userInfo.email && (
                  <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{userInfo.email}</span>
                  </div>
                )}
                {userInfo.phone && (
                  <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{userInfo.phone}</span>
                  </div>
                )}
                {userInfo.location && (
                  <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{userInfo.location}</span>
                  </div>
                )}
                <Separator className="my-2" />
                {userInfo.linkedin && (
                  <a href={userInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors font-semibold group">
                    <Link className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">LinkedIn</span>
                  </a>
                )}
                {userInfo.github && (
                  <a href={userInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors font-semibold group">
                    <Code className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">GitHub</span>
                  </a>
                )}
                {userInfo.portfolio && (
                  <a href={userInfo.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors font-semibold group">
                    <Globe className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Portfolio</span>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Skills Card */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" /> Key Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-wrap gap-2">
                  {userInfo.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-accent border border-border rounded-lg text-xs font-bold text-foreground tracking-wide hover:border-primary/30 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Languages Card */}
            {miscellaneous?.languages && miscellaneous.languages.length > 0 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Languages className="w-4 h-4 text-primary" /> Languages
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-2">
                  {miscellaneous.languages.map((lang, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{lang.language}</span>
                      <span className="text-xs font-bold text-muted-foreground bg-accent/40 px-2 py-0.5 rounded-md">{lang.proficiency}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Interests Card */}
            {miscellaneous?.interests && miscellaneous.interests.length > 0 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" /> Interests
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 flex flex-wrap gap-2">
                  {miscellaneous.interests.map((interest, i) => (
                    <span key={i} className="px-2.5 py-1 bg-accent/30 border border-border rounded-lg text-xs font-semibold text-muted-foreground">
                      {interest}
                    </span>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
