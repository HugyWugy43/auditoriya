package com.audit.apigateway.config;
import org.springframework.stereotype.Component;
import org.springframework.web.server.*;
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Mono;
@Component
public class BoundaryFilter implements WebFilter {
 public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
  if (exchange.getRequest().getPath().value().startsWith("/internal") || exchange.getRequest().getHeaders().containsKey("X-Service-Token")) {
   exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN); return exchange.getResponse().setComplete();
  }
  return chain.filter(exchange);
 }
}
