import { gamificationState, mockDailyTasks, weeklyCalendar } from "../data/mockTasks";

export const taskService = {
  async getTasksData() {
    await new Promise((res) => setTimeout(res, 200));
    const savedState = localStorage.getItem("sips_gamification_state");
    const state = savedState ? JSON.parse(savedState) : gamificationState;

    const savedTasks = localStorage.getItem("sips_daily_tasks");
    const tasks = savedTasks ? JSON.parse(savedTasks) : mockDailyTasks;

    return {
      state,
      tasks,
      calendar: weeklyCalendar
    };
  },

  async completeDailyTask(taskId, submissionData) {
    await new Promise((res) => setTimeout(res, 600));
    const { state, tasks } = await this.getTasksData();

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: "completed",
          completedDate: "Just now",
          userScore: 92,
          submission: submissionData
        };
      }
      return t;
    });

    const updatedState = {
      ...state,
      totalXp: state.totalXp + 150,
      streakDays: state.streakDays + 1,
      completedTasksThisWeek: state.completedTasksThisWeek + 1
    };

    localStorage.setItem("sips_daily_tasks", JSON.stringify(updatedTasks));
    localStorage.setItem("sips_gamification_state", JSON.stringify(updatedState));

    return { updatedState, updatedTasks };
  }
};
