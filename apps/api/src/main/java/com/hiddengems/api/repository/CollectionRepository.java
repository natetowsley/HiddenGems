package com.hiddengems.api.repository;

import com.hiddengems.api.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, UUID> {

    List<Collection> findByUserId(UUID userId);

    void deleteAllByUserId(UUID userId);
}
