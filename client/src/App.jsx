import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JoinLecture from './pages/JoinLecture';
import StudentLecture from './pages/StudentLecture';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherLectureControl from './pages/TeacherLectureControl';
import PostLectureAnalytics from './pages/PostLectureAnalytics'; 
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JoinLecture />} />
        <Route path="/lecture" element={<StudentLecture />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/control" element={<TeacherLectureControl />} />
        <Route path="/teacher/analytics" element={<PostLectureAnalytics />} />
      </Routes>
    </Router>
  );
}

export default App;