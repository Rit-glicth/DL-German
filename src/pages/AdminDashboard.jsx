import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Users, Search, Printer, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentCard from "@/components/admin/StudentCard";
import StudentDetail from "@/components/admin/StudentDetail";
import AdminStats from "@/components/admin/AdminStats";
import StudentReportPrint from "@/components/admin/StudentReportPrint";
import GroupReportPrint from "@/components/admin/GroupReportPrint";

const IB_GROUPS = ["MYP3", "MYP4", "MYP5", "DP1", "DP2"];

export default function AdminDashboard({ isDark }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [showGroupReport, setShowGroupReport] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allSettings = [] } = useQuery({
    queryKey: ["adminAllSettings"],
    queryFn: () => base44.entities.UserSettings.list("-updated_date", 200),
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ["adminAllLessons"],
    queryFn: () => base44.entities.LessonProgress.list("-created_date", 500),
  });

  const { data: allErrors = [] } = useQuery({
    queryKey: ["adminAllErrors"],
    queryFn: () => base44.entities.GrammarError.list("-created_date", 500),
  });

  const { data: allVocab = [] } = useQuery({
    queryKey: ["adminAllVocab"],
    queryFn: () => base44.entities.UserVocabProgress.list("-updated_date", 500),
  });

  // Exclude teachers (admins) from student analytics
  const students = allUsers.filter(u => u.role !== "admin");
  const studentEmails = new Set(students.map(u => u.email));
  const studentSettings = allSettings.filter(s => studentEmails.has(s.created_by));
  const studentLessons = allLessons.filter(l => studentEmails.has(l.created_by));
  const studentErrors = allErrors.filter(e => studentEmails.has(e.created_by));
  const studentVocab = allVocab.filter(v => studentEmails.has(v.created_by));

  const getStudentSettings = (email) => studentSettings.find(s => s.created_by === email);
  const getStudentLessons = (email) => studentLessons.filter(l => l.created_by === email);
  const getStudentErrors = (email) => studentErrors.filter(e => e.created_by === email);
  const getStudentVocab = (email) => studentVocab.filter(v => v.created_by === email);

  // Filter students by year group and search
  const filteredStudents = students.filter(u => {
    const matchesSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (groupFilter === "all") return true;
    const s = getStudentSettings(u.email);
    return s?.ib_year_group === groupFilter;
  });

  // Students for group report
  const studentsForGroupReport = groupFilter === "all" ? students : filteredStudents;
  const groupReportTitle = groupFilter === "all"
    ? "All Students — Overall Report"
    : `${groupFilter} — Year Group Report`;

  return (
    <div className="space-y-8">
      {showReport && selectedStudent && (
        <StudentReportPrint
          user={selectedStudent}
          settings={getStudentSettings(selectedStudent.email)}
          lessons={getStudentLessons(selectedStudent.email)}
          errors={getStudentErrors(selectedStudent.email)}
          vocab={getStudentVocab(selectedStudent.email)}
          isDark={isDark}
          onClose={() => setShowReport(false)}
        />
      )}

      {showGroupReport && (
        <GroupReportPrint
          title={groupReportTitle}
          students={studentsForGroupReport}
          allSettings={studentSettings}
          allLessons={studentLessons}
          allErrors={studentErrors}
          allVocab={studentVocab}
          isDark={isDark}
          onClose={() => setShowGroupReport(false)}
        />
      )}

      <div>
        <h1 className={cn("text-3xl font-bold", isDark ? "text-white" : "text-slate-900")}>
          Teacher Panel
        </h1>
        <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
          Monitor students, add content, and print progress reports
        </p>
      </div>

      {/* Stats — excludes teacher data */}
      <AdminStats
        users={students}
        allSettings={studentSettings}
        allLessons={studentLessons}
        allErrors={studentErrors}
        allVocab={studentVocab}
        isDark={isDark}
      />

      <div className="mt-6">
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className={cn("w-44 rounded-xl", isDark ? "bg-slate-900 border-slate-800 text-white" : "")}>
                <SelectValue placeholder="Year group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Year Groups</SelectItem>
                {IB_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setShowGroupReport(true)}
              variant="outline"
              className={cn("rounded-xl gap-2", isDark ? "border-slate-700 text-slate-300" : "")}
            >
              <BarChart2 className="w-4 h-4" />
              {groupFilter === "all" ? "Overall Report" : `${groupFilter} Report`}
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Student List */}
            <div className={cn("xl:col-span-1 rounded-2xl ring-1 overflow-hidden flex flex-col", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
              <div className="p-4 border-b" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h2 className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>
                    Students ({filteredStudents.length})
                    {groupFilter !== "all" && <span className="ml-2 text-xs font-normal text-blue-500">{groupFilter}</span>}
                  </h2>
                </div>
                <div className="relative">
                  <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5", isDark ? "text-slate-500" : "text-slate-400")} />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search students..."
                    className={cn("pl-9 text-xs h-8 rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredStudents.map(user => {
                  const s = getStudentSettings(user.email);
                  return (
                    <StudentCard
                      key={user.id}
                      user={user}
                      settings={s}
                      lessons={getStudentLessons(user.email)}
                      errors={getStudentErrors(user.email)}
                      isSelected={selectedStudent?.id === user.id}
                      onClick={() => setSelectedStudent(user)}
                      isDark={isDark}
                    />
                  );
                })}
                {filteredStudents.length === 0 && (
                  <p className={cn("text-center text-sm py-8", isDark ? "text-slate-500" : "text-slate-400")}>No students found</p>
                )}
              </div>
            </div>

            {/* Student Detail */}
            <div className="xl:col-span-2">
              {selectedStudent ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      {(() => {
                        const s = getStudentSettings(selectedStudent.email);
                        return s?.ib_year_group ? (
                          <span className={cn("text-xs font-semibold px-2 py-1 rounded-lg", isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600")}>
                            {s.ib_year_group}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <Button
                      onClick={() => setShowReport(true)}
                      variant="outline"
                      className={cn("rounded-xl gap-2", isDark ? "border-slate-700 text-slate-300" : "")}
                    >
                      <Printer className="w-4 h-4" /> Print Individual Report
                    </Button>
                  </div>
                  <StudentDetail
                    user={selectedStudent}
                    settings={getStudentSettings(selectedStudent.email)}
                    lessons={getStudentLessons(selectedStudent.email)}
                    errors={getStudentErrors(selectedStudent.email)}
                    vocab={getStudentVocab(selectedStudent.email)}
                    isDark={isDark}
                  />
                </div>
              ) : (
                <div className={cn("rounded-2xl ring-1 p-12 text-center h-full flex flex-col items-center justify-center", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>Select a student</h3>
                  <p className={cn("text-sm mt-2", isDark ? "text-slate-400" : "text-slate-500")}>
                    Click on a student to view their detailed progress and analytics, then print a report.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}