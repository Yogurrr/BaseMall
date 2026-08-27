import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../api/userApi';

export const UserList = () => {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // 💡 HTML(JSX) 태그를 return 하므로 .tsx 필수!
  return (
    <div>
      {users?.map((u) => (
        <p key={u.id}>{u.name}</p>
      ))}
    </div>
  );
};
