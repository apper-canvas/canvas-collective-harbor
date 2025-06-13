import canvasData from '../mockData/canvas.json';
import usersData from '../mockData/users.json';
import messagesData from '../mockData/messages.json';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class CanvasService {
  constructor() {
    this.canvas = { ...canvasData };
    this.users = [...usersData];
    this.messages = [...messagesData];
  }

  async getCanvas() {
    await delay(300);
    return { ...this.canvas };
  }

  async getUsers() {
    await delay(200);
    return [...this.users];
  }

  async getMessages() {
    await delay(200);
    return [...this.messages];
  }

  async addStroke(stroke) {
    await delay(100);
    this.canvas.strokes.push({ ...stroke });
    return { ...stroke };
  }

  async clearCanvas() {
    await delay(200);
    this.canvas.strokes = [];
    return { ...this.canvas };
  }

  async addMessage(message) {
    await delay(150);
    this.messages.push({ ...message });
    return { ...message };
  }

  async addUser(user) {
    await delay(200);
    this.users.push({ ...user });
    return { ...user };
  }

  async updateUserCursor(userId, position) {
    await delay(50);
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.cursorPosition = { ...position };
    }
    return user ? { ...user } : null;
  }
}

export default new CanvasService();