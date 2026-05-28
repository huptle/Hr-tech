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
import { profileFromSupabaseRow } from "@/lib/profile-from-row";
import { ApplyPortalHeader } from "@/components/apply-portal-header";

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
        setProfile(profileFromSupabaseRow(data.data as Record<string, unknown>, email));
      })
      .catch(() => router.replace("/account"));
  }, [profile, router, setProfile]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <ApplyPortalHeader />
        <p className="text-center text-muted-foreground py-20">Loading profile…</p>
      </div>
    );
  }

  const raw = profile.parsed_data;
  const data = (typeof raw === "string" ? JSON.parse(raw) : raw) as ResumeData;
  if (!data?.userInfo?.name) {
    return <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto text-center text-muted-foreground">
        No structured data available for this profile.
      </div>
    </div>;
  }

  const { userInfo, workExperience, education, projects, certifications, miscellaneous } = data;

  const formatDate = (d: string) => d;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <ApplyPortalHeader />
      <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-12">

        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Button>

        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center text-3xl font-semibold text-foreground">
              {userInfo.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{userInfo.name}</h1>
              <div className="flex items-center gap-2 text-primary text-sm bg-primary/10 px-3 py-1 rounded-full w-fit border border-primary/20 font-medium tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
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
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-9 gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap transition-all"
            >
              <Download className="w-4 h-4" />
              Download Resume
            </a>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="md:col-span-2 space-y-8">

            {workExperience.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-muted-foreground" /> Work Experience
                </h2>
                <div className="space-y-4">
                  {workExperience.map((exp, i) => (
                    <Card key={i} className="shadow-2xl border-border bg-card">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="text-lg font-bold text-foreground">{exp.role}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{exp.company}</span>
                              {exp.location && (
                                <>
                                  <span className="text-border">|</span>
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{exp.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                            {exp.duration && <span className="text-border ml-1">({exp.duration})</span>}
                          </div>
                        </div>
                        {exp.responsibilities.length > 0 && (
                          <ul className="mt-4 space-y-1.5">
                            {exp.responsibilities.map((r, j) => (
                              <li key={j} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                                <span className="text-primary mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-primary" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        )}
                        {exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {exp.technologies.map((tech, j) => (
                              <span key={j} className="px-2 py-0.5 bg-primary/5 border border-primary/10 rounded text-xs font-medium text-primary">
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

            {education.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" /> Education
                </h2>
                <div className="space-y-3">
                  {education.map((edu, i) => (
                    <Card key={i} className="shadow-2xl border-border bg-card">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="font-bold text-foreground">{edu.institution}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                              {edu.gpa ? ` – GPA: ${edu.gpa}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5" />
                            {edu.startDate ? `${formatDate(edu.startDate)} – ` : ""}{formatDate(edu.endDate)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {projects.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Code className="w-5 h-5 text-muted-foreground" /> Projects
                </h2>
                <div className="space-y-3">
                  {projects.map((proj, i) => (
                    <Card key={i} className="shadow-2xl border-border bg-card">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-foreground">{proj.name}</h3>
                              {proj.url && (
                                <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{proj.description}</p>
                          </div>
                        </div>
                        {proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {proj.technologies.map((tech, j) => (
                              <span key={j} className="px-2 py-0.5 bg-secondary/20 border border-secondary/20 rounded text-xs font-medium text-secondary-foreground">
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

            {certifications.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-muted-foreground" /> Certifications
                </h2>
                <Card className="shadow-2xl border-border bg-card">
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      {certifications.map((cert, i) => (
                        <div key={i} className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{cert.name}</p>
                            {cert.issuer && (
                              <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                            )}
                          </div>
                          {cert.year && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">{cert.year}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {miscellaneous.publications.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-muted-foreground" /> Publications
                </h2>
                <Card className="shadow-2xl border-border bg-card">
                  <CardContent className="p-5">
                    <ul className="list-disc list-inside space-y-1">
                      {miscellaneous.publications.map((pub, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{pub}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {miscellaneous.volunteerWork.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-muted-foreground" /> Volunteer Work
                </h2>
                <Card className="shadow-2xl border-border bg-card">
                  <CardContent className="p-5">
                    <ul className="list-disc list-inside space-y-1">
                      {miscellaneous.volunteerWork.map((v, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{v}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {miscellaneous.patents.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-muted-foreground" /> Patents
                </h2>
                <Card className="shadow-2xl border-border bg-card">
                  <CardContent className="p-5">
                    <ul className="list-disc list-inside space-y-1">
                      {miscellaneous.patents.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{p}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {miscellaneous.other && (
              <section>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <FlaskConical className="w-5 h-5 text-muted-foreground" /> Additional Information
                </h2>
                <Card className="shadow-2xl border-border bg-card">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{miscellaneous.other}</p>
                  </CardContent>
                </Card>
              </section>
            )}

          </div>

          <div className="space-y-6">

            <Card className="shadow-2xl border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <UserCircle className="w-4 h-4" /> Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userInfo.email && (
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{userInfo.email}</span>
                  </div>
                )}
                {userInfo.phone && (
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{userInfo.phone}</span>
                  </div>
                )}
                {userInfo.location && (
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{userInfo.location}</span>
                  </div>
                )}
                <Separator className="my-2" />
                {userInfo.linkedin && (
                  <a href={userInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                    <Link className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">LinkedIn</span>
                  </a>
                )}
                {userInfo.github && (
                  <a href={userInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                    <Code className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">GitHub</span>
                  </a>
                )}
                {userInfo.portfolio && (
                  <a href={userInfo.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Portfolio</span>
                  </a>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Code className="w-4 h-4" /> Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userInfo.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-muted border border-border rounded-md text-xs font-semibold text-foreground tracking-wide"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {miscellaneous.languages.length > 0 && (
              <Card className="shadow-2xl border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Languages className="w-4 h-4" /> Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {miscellaneous.languages.map((lang, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{lang.language}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{lang.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {miscellaneous.interests.length > 0 && (
              <Card className="shadow-2xl border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {miscellaneous.interests.map((interest, i) => (
                      <span key={i} className="px-2.5 py-1 bg-muted/50 border border-border rounded-md text-xs font-medium text-muted-foreground">
                        {interest}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
