import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JoinLecture from './pages/JoinLecture';
import StudentLecture from './pages/StudentLecture';
import AuthTeacher from './pages/AuthTeacher';
import TeacherLectureControl from './pages/TeacherLectureControl';

import TeacherLayout from './layouts/TeacherLayout';
import TeacherDashboard from './pages/TeacherDashboard';
import GlobalAnalytics from './pages/GlobalAnalytics';
import LectureArchive from './pages/LectureArchive';
import TeacherSettings from './pages/TeacherSettings';
import PostLectureAnalytics from './pages/PostLectureAnalytics';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JoinLecture />} />
        <Route path="/login" element={<AuthTeacher />} />
        <Route path="/lecture" element={<StudentLecture />} />
        <Route
          path="/teacher/control"
          element={
            <ProtectedRoute>
              <TeacherLectureControl />
            </ProtectedRoute>
          }
        />

        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="analytics-global" element={<GlobalAnalytics />} />
          <Route path="archive" element={<LectureArchive />} />
          <Route path="settings" element={<TeacherSettings />} />
          <Route path="analytics/:id" element={<PostLectureAnalytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;