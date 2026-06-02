package com.hiddengems.api.repository;

import com.hiddengems.api.entity.CollectionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionItemRepository extends JpaRepository<CollectionItem, UUID> {

    List<CollectionItem> findByCollectionId(UUID collectionId);

    boolean existsByCollectionIdAndLocationId(UUID collectionId, UUID locationId);

    void deleteByCollectionIdAndLocationId(UUID collectionId, UUID locationId);

    void deleteAllByCollectionId(UUID collectionId);

    void deleteAllByLocationId(UUID locationId);
}
