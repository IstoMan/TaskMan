const UserRole = Object.freeze({
  ADMIN: "admin",
  MEMBER: "member",
});

type Users = {
  userID: string;
  name: string;
  email: string;
  role: (typeof UserRole)[keyof typeof UserRole];
};

export { UserRole };
export type { Users };