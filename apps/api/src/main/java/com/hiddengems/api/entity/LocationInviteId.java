package com.hiddengems.api.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class LocationInviteId implements Serializable {

    private UUID locationId;
    private UUID userId;

    public LocationInviteId() {}

    public LocationInviteId(UUID locationId, UUID userId) {
        this.locationId = locationId;
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LocationInviteId that)) return false;
        return Objects.equals(locationId, that.locationId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(locationId, userId);
    }
}
