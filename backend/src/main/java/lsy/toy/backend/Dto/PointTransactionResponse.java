package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.PointTransaction;

import java.time.Instant;

public class PointTransactionResponse {
    private final Long id;
    private final Integer amount;
    private final String description;
    private final Instant createdAt;

    public PointTransactionResponse(PointTransaction transaction) {
        this.id = transaction.getId();
        this.amount = transaction.getAmount();
        this.description = transaction.getDescription();
        this.createdAt = transaction.getCreatedAt();
    }

    public Long getId() { return id; }
    public Integer getAmount() { return amount; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
}
