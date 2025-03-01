package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.UserData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserDataRepository extends JpaRepository<UserData, Integer> {
    UserData findByUser_Id(int userId);
    @Query(value = "SELECT * FROM user_data WHERE user_id = :userId ORDER BY created_at DESC", nativeQuery = true)
    List<UserData> findLoginHistoryByUserId(@Param("userId") int userId);
}
