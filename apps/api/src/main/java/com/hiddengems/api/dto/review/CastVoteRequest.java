package com.hiddengems.api.dto.review;

import com.hiddengems.api.entity.ReviewVote;
import jakarta.validation.constraints.NotNull;

public record CastVoteRequest(
        @NotNull(message = "Vote type is required")
        ReviewVote.VoteType voteType
) {}
