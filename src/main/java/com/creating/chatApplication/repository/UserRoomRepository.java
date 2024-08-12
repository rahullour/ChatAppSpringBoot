package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoomRepository extends JpaRepository<UserRoom, Long> {
    UserRoom findByUserAndRoomId(User user, String roomId);
}
